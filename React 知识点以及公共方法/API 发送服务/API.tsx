import * as React from 'react'
import _ from 'underscore'
import ServerConfig from '@superid/ServerConfig'
import { requestLogHandler } from '@superid/utils/logmonitor';

function toQueryURL (url: string, searchParams: { [name: string]: string | number | boolean }) {
  let search = new URLSearchParams()
  Object.entries(searchParams).forEach(entry => {
    search.append(entry[0], String(entry[1]))
  })
  const searchStr = search.toString()
  return Boolean(searchStr) ? `${url.toString()}?${searchStr}` : url.toString()
}
/* get method */
interface QueryParams {
  url: string,
  searchParams?: { [name: string]: string | number | boolean },
  affairId?: number | string,
  roleId?: number | string,
  resourceId?: number | string,
  userId?: number | string,
  option?: RequestInit,
  allianceId?: number | string,
  headers?: any;
}
const API = {
  query: (params: QueryParams, debounce = false) => {
    const { url, ...otherOptions } = params;

    return fetch(toQueryURL(ServerConfig.ServerOrigin + params.url, params.searchParams || {}), {
      method: 'GET',
      headers: {
        'X-SIMU-RoleId': params.roleId ? params.roleId + '' : '0',
        'X-SIMU-AffairId': params.affairId ? params.affairId + '' : '0',
        'X-SIMU-UserId': params.userId ? params.userId + '' : '0',
        'X-SIMU-ResourceId': params.resourceId ? params.resourceId + '' : '0',
        'X-SIMU-AllianceId': params.allianceId ? params.allianceId + '' : '0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(params.headers || {}),
      },
      debounce,
      ...(params.option || {})
    }).then(res => res.json()).then(res => requestLogHandler(url, otherOptions, res, {}))
  },
  mutation: (params: QueryParams, debounce = true) => API.query(params, debounce)
}

type QueryChildren = (json: any, utils: { refresh: () => void }) => React.ReactNode
interface QueryProps extends QueryParams {
  updateKey?: any, 
  children: QueryChildren,
}
class Query extends React.Component<QueryProps> {
  state = {
    json: { code: -1010 }
  }
  componentDidMount() {
    API.query(this.props).then(json => this.setState({ json }))
  }
  componentDidUpdate(prevProps: QueryProps) {
    // if (this.props.updateKey && this.props.updateKey)
    if (_.isEqual(this.props.url, prevProps.url)
      && _.isEqual(this.props.searchParams, prevProps.searchParams)
      && _.isEqual(this.props.option, prevProps.option)
    ) {
      return
    } else {
      API.query(this.props).then(json => this.setState({ json }))
    }
  }
  componentDidCatch() {
    return
  }
  refresh = () => {
    return API.query(this.props).then(json => {
      this.setState({ json })
      return json
    })
  }
  render() {
    const { json } = this.state
    return (this.props.children)(
      json,
      {
        refresh: () => API.query(this.props).then(res => this.setState({ json: res }))
      }
    )
  }
}

export default API

export {
  Query
}
