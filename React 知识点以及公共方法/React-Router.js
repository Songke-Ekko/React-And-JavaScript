// ①：webpack 确定入口文件：

module.exports = {
  mode: 'production',
  entry: {
    app: [
      './src/client.jsx',
    ],
    vendor: ['react', 'react-dom', 'draft-js'],
  },
}

// ②入口文件引用 react-router：

import Routes from './routes';
import { LocaleProvider } from 'antd';

render() {
  return (
    <LocaleProvider locale={zh_CN}>
      <Routes />
    </LocaleProvider>
  )
}

// ③ router 文件中引入具体路由：

import { Route, Switch, Redirect } from '../../../node_modules/react-router';

const WorkspaceContainer = Loadable({
  loader: () => import('./containers/WorkspaceContainer'),
  loading: () => null,
})

render() {
  return (
    <div>
      <Route path={"/workspace"} exact component={WorkspaceContainer} />
      <Redirect4 path="/" exact to="/workspace" />
    </div>
  )
}
