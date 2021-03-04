import { createHashHistory, createBrowserHistory } from 'history'
import qhistory from 'qhistory'
import { stringify, parse } from 'qs'

let history = createHashHistory()
history = qhistory(history, stringify, parse)
export default history
