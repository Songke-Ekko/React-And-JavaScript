connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options]) 

// connect 接收 4 个参数
// ① mapStateToProps：mapStateToProps(state, ownProps) : stateProps
// 这个函数允许我们将 store 中的数据作为 props 绑定到组件上
// 第一个参数就是 Redux 的 store
// 第二个参数就是 ownProps，是自己的 props
// 第三个参数通常不用传，作用是将 stateProps 或者是 dispatchProps merge 之后赋给组件，不传就会自动使用 Object.assign 方法
// 第四个参数是其它参数

const mapStateToProps = (state) => {
    return {
      count: state.count
    }
}

// ② mapDispatchToProps: 将 action 作为 props 绑定到自己的组件上
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
      increase: (...args) => dispatch(actions.increase(...args)),
      decrease: (...args) => dispatch(actions.decrease(...args))
    }
  }
  
  class MyComp extends Component {
    render(){
      const {count, increase, decrease} = this.props;
      return (<div>
        <div>计数：{this.props.count}次</div>
        <button onClick={increase}>增加</button>
        <button onClick={decrease}>减少</button>
      </div>)
    }
  }
  
  const Comp = connect(mapStateToProps， mapDispatchToProps)(MyComp);




// 实际用法：
export default connect(state => ({
    taskList: state.getIn(['summary', 'myTaskList']) || fromJS([]),
    taskCreateList: state.getIn(['summary', 'myCreateTaskList']),
    taskAssistList: state.getIn(['summary', 'myAssistTaskList']),
    workspaceTaskStateFilter: state.getIn(['setting', 'workspace', 'taskStateFilter']),
    workspaceTaskOrder: state.getIn(['setting', 'workspace', 'taskOrder']),
    summaryTaskFilter: state.getIn(['setting', 'summaryTaskFilter']),
    summaryServiceFilter: state.getIn(['setting', 'summaryServiceFilter']),
    auditList: state.getIn(['summary', 'todoAudit', 'data']) || fromJS([]),
    printerAvailable: state.getIn(['user', 'printerAvailable']),
    recentAllChats: state.getIn(['message', 'summary', 'recentAllChats']),
    user: state.get('user'),
    work: state.get('work'),
}), dispatch => ({
    fetchMyTask: bindActionCreators(fetchMyTask, dispatch),
    fetchAssistTask: bindActionCreators(fetchAssistTask, dispatch),
    fetchCreateTask: bindActionCreators(fetchCreateTask, dispatch),
    fetchTodoAuditList: bindActionCreators(fetchTodoAuditList, dispatch),
    changeWorkspaceTaskStateFilter: bindActionCreators(changeWorkspaceTaskStateFilter, dispatch),
    changeWorkspaceTaskOrder: bindActionCreators(changeWorkspaceTaskOrder, dispatch),
    getTaskChatKey: bindActionCreators(getTaskChatKey, dispatch),
    markTaskAsRead: bindActionCreators(markTaskAsRead, dispatch),
    dispatch,
}), null, { withRef: true })(TodoContainer)