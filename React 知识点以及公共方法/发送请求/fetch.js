import 'whatwg-fetch'
import UserAgent from '@superid/utils/UserAgent'
import { Message } from 'antd'
import { Toast } from 'antd-mobile'
import { userLog, UserLogId, UserLogSubType } from '@superid/utils/logmonitor';
import config from '../config'
import { logout } from '../actions/user'
import RequestDebounceMap from './RequestDebounceMap'

window.refreshTokenPromise = null;
const thatFetch  = window.fetch

window.fetch = (...args) => {
  if (window.refreshTokenPromise) {
    return window.refreshTokenPromise.then(() => {
      return customFetch.apply(null, args);
    })
  } else {
    // 检查是否过期
    let jwt
    try {
      jwt = JSON.parse(localStorage.getItem('auth'))
    } catch (e) {}

    if (jwt && jwt['expires_in'] && jwt['X-SIMU-Time']) {
      // jwt['expires_in'] = 3
      const exp = jwt['expires_in'] * 1000 + jwt['X-SIMU-Time']; // 后端 expires_in 单位为秒；X-SIMU-Time 单位为毫秒。

      if (exp < Date.now() && jwt['refresh_token']) {
        let authorization = 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=';
        if (jwt['X-SIMU-ClientId'] && jwt['X-SIMU-ClientId'] === 'h5') {
          authorization = 'Basic aDU6aDU=';
        }
        window.refreshTokenPromise = thatFetch(`${config.gwURL}/oauth/token?grant_type=refresh_token&refresh_token=${jwt['refresh_token']}`, {
          method: 'POST',
          headers: {
            'Authorization': authorization,
          },
        }).then((res) => {
          // 后端利用 status 标记结果而不是 body.code 
          if (res.status === 200) {
            return res.json();
          }

          try {
            userLog(
              UserLogSubType.USER,
              UserLogId.LOGOUT,
              {
                traceId: res.headers.get('x-traceid'),
              },
              `${config.gwURL}/oauth/token?grant_type=refresh_token&refresh_token=${jwt['refresh_token']}`,
            );
          } catch(err) {
            console.error(err);
          }

          return null
        }).then(res => {
          window.refreshTokenPromise = null;

          if (res) {
            // 刷新成功
            window.storeDispatch && window.storeDispatch({
              type: 'LOGIN_SUCCESS',
              payload: res
            })

            return customFetch.apply(null, args);
          } else {
            return {
              code: 401,
            }
          }
        });

        return window.refreshTokenPromise;
      }
    }

    return customFetch.apply(null, args);
  }
}

const isArray = Array.isArray

let reloading = false
let LOGOUT_DOOR_TIMESTAMP
// 当服务器返回未登录时，进行相应的逻辑处理.
const requestDebounceMap = RequestDebounceMap.instance()

const customFetch = function(url, opt = {}, isShare = false) {
  if (
    opt.useOriginFetch
    || Array.isArray(opt.headers) // OSS相关的库会使用 Array 的形式进行 headers 的设置。
    || (url instanceof Request ? url.url.includes('aliyuncs.com') : typeof url === 'string' ? url.includes('aliyuncs.com') : false) // aliyun相关库不使用自定义header否则报CORS错误
  ) {
    return thatFetch(url, opt)
  }

  const _startTimestamp = Date.now()
  const debounceFetch = opt.debounce === false ? false : true

  // 添加来自 localStorage 中的的请求头
  let localStorageHeaders = {}
  try {
    localStorageHeaders = JSON.parse(localStorage.getItem('headers'))
  } catch (e) {
    localStorageHeaders = {}
  }

  opt.headers = {
    ...(opt.headers || {}),
    ...localStorageHeaders,
  }

  // 添加 jwt 请求头部
  let jwt
  try {
    jwt = JSON.parse(localStorage.getItem('auth'))
  } catch (e) {}

  if (jwt) {
    opt.headers = {
      'Authorization': opt.headers.authorization || `bearer${jwt.access_token}`,
      'X-SIMU-RoleId': opt.roleId == undefined ? (localStorage.getItem('personalRoleId') || 0) : opt.roleId,
      'X-SIMU-AffairId': opt.affairId || 0,
      'X-SIMU-ResourceId': opt.resourceId || 0,
      'X-SIMU-AllianceId': opt.allianceId || 0,
      ...(opt.headers || {}),
    }
  } else {
    opt.headers = {
      'X-SIMU-RoleId': 0,
      'X-SIMU-AffairId': 0,
      'X-SIMU-ResourceId': 0,
      'X-SIMU-AllianceId': opt.allianceId || 0,
      ...(opt.headers || {}),
    }
  }
  // 避免频繁发送完全相同的请求.
	if (requestDebounceMap.hasRequest(url, opt) && debounceFetch) {
    console.warn(`频繁请求: ${url}`)
    return new Promise(() => {})
  } else {
    debounceFetch && requestDebounceMap.addRequest(url, opt)
    return thatFetch
      .apply(this, [url, opt])
      .then(res => {
        setTimeout(() => requestDebounceMap.resolveRequest(url, opt), 500)

        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('image/')) {
          return res;
        }

        let traceId
        try {
          traceId = res.headers.get('x-traceid');
        } catch(err) {}

        res.clone()
          .json()
          .then(res => {
            // 后端需要记录 code 异常时的请求
            try {
              if (res.code === -1 || res.code === 500 || res.code === 2500 || res.code === 403) {
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

            if (isShare || url.includes('LDAPLogin')){
              return
            } else {
            if (res && (res.code === 401 || res.status === 401)) {
              // 为了避免循环 reload, 忽略专门进行登录检测的请求进行忽略。
              if (!~url.indexOf('ping') && !~url.indexOf('logout') && !~url.indexOf('check_token') && reloading == false && (!LOGOUT_DOOR_TIMESTAMP || _startTimestamp > LOGOUT_DOOR_TIMESTAMP)) {
                reloading = true
                setTimeout(() => {

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

                  LOGOUT_DOOR_TIMESTAMP = Date.now()
                  logout()(window.storeDispatch)
                  UserAgent.isMobile ? Toast.info('登录已过期，请重新登录') : Message.error('登录已过期，请重新登录')
                  reloading = false
                }, 2000)
              }
            }
          }
        });

        return res
      }, err => {
        setTimeout(() => requestDebounceMap.resolveRequest(url, opt), 500)

        if (opt && opt.method !== 'GET' && !opt.suppress) {
          Message.error('网络连接不通畅，请稍后再试')
        }
      })
  }
}



/* save for fetch-mock */
window.originalFetch = thatFetch
