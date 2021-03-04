import 'whatwg-fetch'
import 'url-search-params-polyfill'
import { Message } from 'antd'
import { Toast } from 'antd-mobile'
import UserAgent from '@superid/utils/UserAgent'
import store from '@superid/Store'
import { RootHooks } from '@superid/RootHooks'
import { SyncHook } from '@superid/utils/tapable'
import { requestLogHandler } from '@superid/utils/logmonitor'
import ServerConfig from '../ServerConfig'
import { userLog, UserLogId, UserLogSubType } from '@superid/utils/logmonitor';


const { fetch } = window
let isLogout = false
let logoutDoorTimestamp = 0

RootHooks.createHook('request.logout', new SyncHook(['dispatch']))

function toQueryURL(url, searchParams) {
  // eslint-disable-next-line
  const search = new URLSearchParams()
  Object.entries(searchParams).forEach(entry => {
    search.append(entry[0], String(entry[1]))
  })
  const searchStr = search.toString()
  return searchStr ? `${url.toString()}?${searchStr}` : url.toString()
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
function requestImpl(url, option = {}) {
  // special branch for empty url situations, it's currently used by websocket reconnect preprocess.
  if (!url) {
    return Promise.resolve()
  }

  const queryUrl = toQueryURL(url, option.searchParams || {})

  const startTimestamp = Date.now()

  const defaultOptions = {
    credentials: 'include',
    headers: {}
  }
  const newOptions = { ...defaultOptions, ...option }
  if (
    newOptions.method === 'POST'
    || newOptions.method === 'PUT'
    || newOptions.method === 'DELETE'
  ) {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...newOptions.headers
      }
      newOptions.body = JSON.stringify(newOptions.body)
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: 'application/json',
        ...newOptions.headers
      }
    }
  }

  // 添加来自 localStorage 中设置的 headers
  let localStorageHeaders = {}
  try {
    localStorageHeaders = JSON.parse(localStorage.getItem('headers'))
  } catch (e) {
    localStorageHeaders = {}
  }
  newOptions.headers = {
    ...localStorageHeaders,
    ...newOptions.headers
  }

  // 添加 jwt headers
  let jwt = false
  try {
    if (url.indexOf('/ping') < 0) {
      jwt = JSON.parse(localStorage.getItem('auth'))
    }
  } catch (e) {
    jwt = false
  }
  if (jwt) {
    newOptions.headers = {
      Authorization: newOptions.headers.authorization || `bearer${jwt.access_token}`,
      'X-SIMU-RoleId': newOptions.roleId == undefined ? (localStorage.getItem('personalRoleId') || 0) : newOptions.roleId,
      'X-SIMU-AffairId': newOptions.affairId || 0,
      'X-SIMU-ResourceId': newOptions.resourceId || 0,
      'X-SIMU-AllianceId': newOptions.allianceId || 0,
      ...(newOptions.headers || {})
    }
  } else {
    newOptions.headers = {
      'X-SIMU-RoleId': 0,
      'X-SIMU-AffairId': 0,
      'X-SIMU-ResourceId': 0,
      'X-SIMU-AllianceId': newOptions.allianceId || 0,
      ...(newOptions.headers || {})
    }
  }


  let traceId
  return fetch(queryUrl, newOptions)
    .then(response => {
      try {
        traceId = response.headers.get('x-traceid');
      } catch(err) {}

      // DELETE and 204 do not return data by default
      // using .json will report an error.
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text()
      }
      return response.json()
    })
    .then(response => {
      // 后端需要记录 code 异常时的请求
      try {
        if (response.code === -1 || response.code === 500 || response.code === 2500 || response.code === 403) {
          userLog(
            -1,
            -1,
            {
              traceId,
            },
            url,
          );
        }
      } catch(err) {}

      if (response && (response.code === 401 || response.status === 401)) {
        // 未登录状态
        // 为了避免循环, 忽略专门进行登录检测的请求
        if (!~queryUrl.indexOf('ping') && !~queryUrl.indexOf('logout') && !~queryUrl.indexOf('check_token') && !isLogout && (!logoutDoorTimestamp || startTimestamp > logoutDoorTimestamp)) {
          isLogout = true

          setTimeout(() => {
            logoutDoorTimestamp = Date.now()

            try {
              userLog(
                UserLogSubType.USER,
                UserLogId.LOGOUT,
                {
                  traceId,
                },
                url,
              );
            } catch(err) {
              console.error(err);
            }

            RootHooks.callHook('request.logout', store.dispatch)

            if (UserAgent.isMobile) {
              Toast.info('登录已过期，请重新登录')
            } else {
              Message.error('登录已过期，请重新登录')
            }
          }, 2000)
        }
      }

      return response
    })
    .then(res => requestLogHandler(url, option, res, {}))
}

export default function request(...args) {
  if (window.refreshTokenPromise) {
    return window.refreshTokenPromise.then(() => {
      // 空请求则业务场景对应需要获取最新的refresh token，如果当前已经有人获取了token，则需要拿到新的token再返回给调用者
      if (!args[0]) {
        let authToken
        try {
          authToken = JSON.parse(localStorage.getItem('auth'))
        } catch (e) {
          console.log(e)
        }
        return Promise.resolve(authToken)
      }
      return requestImpl(...args)
    })
  }
  // 检查是否过期
  let jwt
  try {
    jwt = JSON.parse(localStorage.getItem('auth'))
  } catch (e) {
    console.log(e)
  }

  // 针对socket重连前的静态检查，允许请求空连接来仅处理refreshToken流程
  if (jwt && jwt.expires_in && jwt['X-SIMU-Time'] && (!args[0] || args[0].indexOf('/ping') === -1)) {
    // jwt['expires_in'] = 3
    const exp = jwt.expires_in * 1000 + jwt['X-SIMU-Time'] // 后端 expires_in 单位为秒；X-SIMU-Time 单位为毫秒。

    if (exp < Date.now() && jwt.refresh_token) {
      let authorization = 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ='
      if (jwt['X-SIMU-ClientId'] && jwt['X-SIMU-ClientId'] === 'h5') {
        authorization = 'Basic aDU6aDU='
      }
      window.refreshTokenPromise = fetch(`${ServerConfig.ServerOrigin}/login/oauth/token?grant_type=refresh_token&refresh_token=${jwt.refresh_token}`, {
        method: 'POST',
        headers: {
          Authorization: authorization
        }
      }).then(res => {
        // 后端利用 status 标记结果而不是 body.code
        if (res.status === 200) {
          return res.json()
        }

        try {
          userLog(
            UserLogSubType.USER,
            UserLogId.LOGOUT,
            {
              traceId: res.headers.get('x-traceid'),
            },
            `${ServerConfig.ServerOrigin}/login/oauth/token?grant_type=refresh_token&refresh_token=${jwt.refresh_token}`,
          );
        } catch(err) {
          console.error(err);
        }

        return null
      }).then(res => {
        window.refreshTokenPromise = null

        if (res) {
          // 刷新成功
          store.dispatch({
            type: 'LOGIN_SUCCESS',
            payload: res
          })

          // 空请求则业务场景对应需要获取最新的refresh token，这里应该返回对应的新token
          if (!args[0]) {
            return Promise.resolve(res)
          }

          return requestImpl(...args)
        }

        return {
          code: 401
        }
      })

      return window.refreshTokenPromise
    }
  }

  return requestImpl(...args)
}
