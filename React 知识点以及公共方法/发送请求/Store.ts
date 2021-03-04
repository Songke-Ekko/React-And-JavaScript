
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware, compose, Store } from 'redux'
import { persistStore, autoRehydrate } from 'redux-persist-immutable'
import createMigration from 'redux-persist-migrate'
import { routerMiddleware, connectRouter } from 'connected-react-router/immutable'
import { initializeMessageCenter } from '@packages/superid-font-2-0/src/utils/chat'
import user from '@packages/superid-font-2-0/src/reducer/user'
import setting from '@packages/superid-font-2-0/src/reducer/setting'
import createSagaMiddleware from 'redux-saga'
import { callAPIMiddleware } from './middlewares'
import history from './History'
import { combineReducers } from 'redux-immutable'
import { SyncWaterfallHook } from '@superid/utils/tapable'
import { RootHooks } from '@superid/RootHooks'
import _ from 'underscore'

// v4默认没有版本（用-1代替），当前已修改一版，计数默认递增1，对应版本差异处理对应的数据迁移
const persistVersion = 2
// 注册业务持久化数据升级回调，后续需要升级数据时，通过该钩子调用
RootHooks.createHook('store.persist.upgrade', new SyncWaterfallHook(['state', 'version']))

// 获取当前版本差异记录所有需要的版本数据处理钩子
const createPersistMigration = () => {
  const migrations = {}

  _.range(persistVersion + 1).map(version => migrations[version] = (state) => {
    return RootHooks.callHook('store.persist.upgrade', state, version) || state
  })

  return createMigration(
    migrations,
    (state) => {
      if (state.setting) {
        const version = state.setting.get('persistVersion')
        return (!version && version !== 0) ? -1 : version
      }
      return -1
    },
    (state, version) => {
      if (state.setting) {
        return {
          ...state,
          setting: state.setting.set('persistVersion', version),
        }
      }
      return state
    }
  )
}

/* 
* for the purpose that we inject reducers in an async way,
* we don't provide initial reducers to create store any more,
* instead just use the function injectReducer to make it right. 
*/
const createMyStore = () => {
  let middlewares = []

  middlewares.push(thunkMiddleware)
  middlewares.push(callAPIMiddleware)
  // middlewares for development
  if (process.env.NODE_ENV !== 'production') {
    const createLogger = require('redux-logger').createLogger

    // middleware that logs the global state for debug
    const loggerMiddleware = createLogger({
      stateTransformer: (state) => {
        return state && state.toJS ? state.toJS() : state
      },
    })
    middlewares.push(loggerMiddleware)
  }
  const sagaMiddleware = createSagaMiddleware()
  middlewares.push(sagaMiddleware)
  middlewares.push(routerMiddleware(history))

  const createStoreWithMiddleware = compose(createPersistMigration(), applyMiddleware(...middlewares))(createStore)
  const reducers = connectRouter(history)(combineReducers({ setting }))
  const _store = autoRehydrate()(createStoreWithMiddleware)(reducers)

  persistStore(_store, {
    whitelist: ['setting'],
  })
  initializeMessageCenter(_store)

  // 提供行业线添加新 reducer 的入口
  _store.asyncReducers = {}

  _store.injectReducers = (asyncReducers) => {
    _store.asyncReducers = { setting, ..._store.asyncReducers, ...asyncReducers }
    _store.replaceReducer(connectRouter(history)(combineReducers(_store.asyncReducers)))
  }

  _store.injectReducer = (name, asyncReducer) => {
    _store.injectReducers({ [name]: asyncReducer })
  }

  _store.injectSagas = (sagas=[]) => {
    sagas.forEach(saga => {
      sagaMiddleware.run(saga)
    })
  }

  return _store
}

const store: Store & { injectReducer: (key: string, reducer: any) => any } = createMyStore()

store.injectReducer('user', user)

export default store