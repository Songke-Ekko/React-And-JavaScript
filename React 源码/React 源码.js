// --------------------

// setState: 
// 执行原理：
// 在执行 setState 的时候，ReactComponent 会将新的 state 放入自己的等待队列，然后使用全局的批量策略对象 batchingStragety
// 来查看当前执行流是否处于批量更新当中，如果已经处于更新流中，就将记录了 newState 的 React Component 存入 dirtyComponent 中，
// 如果没有处于更新中，遍历 dirty 中的 component，调用 updateComponent，进行 state 或 props 的更新，刷新 component

// （1）setState 为什么是异步的，并且是批量更新？
// 如果一个循环有很多次，里面写 setState 组件就会一直触发重渲染，为了防止这种事情发生，需要异步和批量更新
// 具体的做法：首先要有一个队列来保存每次 setState 的数据，然后在一段时间后，清空这个队列，然后渲染组件，
// 渲染组件不能在遍历队列时执行，因为同一个组件可能会多次添加到队列中，所以需要另一个队列保存所有组件。

// （2）setState 是真的异步吗？
// setState 的所谓异步只是在合成事件和钩子函数中是异步的，在原生事件和 setTimeout 中都是同步的
// setState 的异步并不是说内部用异步函数实现的，而是因为合成事件和钩子函数的调用在 state 更新之前，
// 导致在合成事件以及钩子函数中没法立刻拿到值，形成了所谓的异步，其实在第二个参数 callBack 中可以拿到更新之后的值

// （3）setState 分为两种操作：
// ① 原生事件（onClick/onChange）, http请求, setTimeout/setInterval, promise, other(其它微任务操作)
// 这类操作执行的时候，会先执行 enqueueUpdate，这时监测到批量更新策略的 isBatchingUpdates 为 false，就会执行
// ReactDefaultBatchingStrategy 的 batchedUpdates 方法并且把 enqueueUpdate 作为回调函数往下传递，然后维护
// enqueueUpdate, 把新的 setState 加入到队列当中，这个时候 dirtyComponent 执行 push 操作加入到组件中

// ② 组件生命周期创建阶段，react 合成事件，这类是 React 可控的
// 在组件创建阶段，创建事务对象，后续就会基于此事务进行操作，在 eventLoop 中，会先执行 ReactDefaultBatchingStrategy 的
// batchedUpdates 方法，设置 isBatchingUpdates 为 true，此变量值在 eventLoop 开始的时候为 false，结束的时候为 false
// 然后执行 transaction.prform，然后 init 事务相关配置，开始执行 setState，接着就是维护 enqueueUpdate，把新的 setState
// 加入到队列中，这个时候 dirtyComponent 执行 push 操作加入到组件中


// setState 源码：
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the dafault updater but the real one gets injected by the renderer.
  this.updater = updater || ReactNoopUpdateQueue
}

ReactComponent.prototype.setState = function (partialState, callback) {
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueSetState(this, callback, 'setState')
  }
}


// Updater 注入：
// updater 是通过依赖注入的方式，在组件实例话的时候注入进来的
// this.updater.enqueueSetState 最终执行到 ReactUpdates.enqueueUpdate
// internalInstance 是用于内部操作的 ReactCompositeComponent 实例，将它的
// _pendingStateQueue 初始化为空数组并插入一个新的 state。

// ReactCompositeComponent.js
mountComponent: function (transaction, hotParent, hostContainerInfo, context) {
  ...
  var updateQueue = transaction.getUpdateQueue();

  var doConstruct = shouldContruct(Component);

  var inst = this._constructComponent(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  )
}

// ReactReconcileTransaction.js
var ReactUpdateQueue = require('ReactUpdateQueue');

getUpdateQueue: function () {
  return ReactUpdateQueue;
}

// ReactUpdateQueue.js
var ReactUpdates = require('ReactUpdates');
const { default: IdentificationContainer } = require('../../../superid-web/superid_packages/superid-font-2-0/src/containers/affair/setting/IdentificationContainer');

enqueueSetState: function (publicInstance, partialState) {
  ...

  var internalInstance = getInternalInstanceReadyForUpdate(
    publicInstance,
    'setState'
  );

  if (!internalInstance) {
    return;
  }

  var queue = internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = []);
  queue.push(partialState)
},

function enqueueUpdate(internalInstance) {
  ReactUpdates.enqueueUpdate(internalInstance)
}


// Transaction 最终操作：
// Transaction 最终操作会调用 ReactUpdates 的 runBatchedUpdates

function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;

  ...
  for (let i = 0; i < len; i++) {
    var component = dirtyComponents[i];
    ...
    ReactReconciler.performUpdateIfNecessary(
      component,
      transaction.reconcileTransaction,
      updateBatchNumber
    );
    ...
  }
}

// 调用 ReactReconciler 的 performUpdateIfNecessary，然后到 ReactCompositeComponent 的一系列方法：
performUpdateIfNecessary: function (transaction) {
  if (this._pendingElement !== null) {
    ReactReconciler.receiveComponent(
      this,
      this._pendingElement,
      transaction,
      this._context
    );
  } else if (this._pendingStateQueue !== null || this._pendingForceUpdate){
    this.updateComponent(
      transaction,
      this._currentElement,
      this._currentElement,
      this._context,
      this._context
    );
  } else {
    this._updaterBatchNumber = null;
  }
},

updateComponent: function (transaction, prevParentElement, nextParentElement, prev) {
  var inst = this._instance;
  ...
  var nextState = this._processPendingState(nextProps, nextContext);
  ...
  this._performComponentUpdate(
    nextParentElement,
    nextProps,
    nextState,
    nextContext,
    transaction,
    nextUnmaskedContext
  );
},

_processPendingState: function (props, context) {
  var inst = this._instance;
  var queue = this._pendingStateQueue;
  var replace = this._pendingRepalceState;

  ...

  var nextState = Onject.assign({}, replace ? queue[0] : inst.state);
  for (let i = replace ? 1 : 0; i < queue.length; i++) {
    var partial = queue[i]
    Object.assign(
      nextState,
      typeof partial === 'function' ?
      partial.call(inst, nextState, props, context) :
      partial
    );
  }
  
  return nextState;
},

_performComponentUpdate: function (nextElement, nextProps, nextState, nextContext, transaction, unmaskedContext) {
  var inst = this._instance;
  ...
  this._unpdateRenderedComponent(transaction, unmaskedContext);
  ...
},

// 调用组件的 render 方法以及更新相应的 DOM 
_updateRenderedComponent: function (transaction, context) {
  // ReactDomComponent
  var prevComponentInstance = this._renderedComponent;

  // 上一次的 virtual DOM (ReactElement)
  var prevRenderedElement = prevComponentInstance._currentElement;

  // 调用 render 获取最新的 virtual DOM (ReactElement)
  var nextRenderedElement = this._renderValidatedComponent();
  ...
  if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
    ReactReconciler.receiveComponent(
      prevComponentInstance,
      nextRenderedElement,
      transaction,
      this._processChildContext(context)
    )
  }
  ...
},

// 这里最重要的方式就是 _processPendingState 和 _updateRenderedComponent 
// _processPendingState 是真正更新 state 的地方，其实它就是一个 Object.assign()
// _updateRenderedComponent 会取出实例的 ReactDOMComponet，然后调用 render 方法，得出最新的 Virtual DOM 后启动 Diff 的过程


// Diff 算法
// ReactReconciler.receiveComponent 最终会调用 ReactDOMComponent 的 receiveComponent 方法，进而再调用 updateComponent 方法：

updateComponent: function (transaction, prevElement, nextElement, context) {
  var lastProps = prevElement.props;
  var nextProps = this._currentElement.props;
  ...
  this._updateDOMProperties(lastProps, nextProps, transaction);
  this._updateDOMChildren(
    lastProps,
    nextProps,
    transaction,
    context
  );
  ...
},

// 这个方法有两个操作，一个是更新属性，一个是更新子孙节点。下面是更新属性的操作：
_updateDOMProperties: function (lastProps, nextProps, transaction) {
  var propKey;
  var styleName;
  var styleUpdates;

  // 删除旧的属性
  for (propKey in lastProps) {
    // 筛选出后来没有但是之前有的属性
    if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null) {
      continue;
    }
    if (propKey === STYLE) {
      var lastStyle = this._previousStyleCopy
      // 初始化 styleUpdates，之前所有的 style 属性设置为空
      for (styleName in lastStyle) {
        // 将旧的 style 属性设置为空
        if (lastStyle.hasOwnProperty(styleName)) {
          styleUpdates = styleUpdates || {};
          styleUpdates[styleName] = '';
        }
      }
      this._previousStyleCopy = null;
    } ...
    else if(DOMProperty.properties[propKey] || DOMProperty.isCustomAttribute(propKey)) {
      DOMPropertyOperations.deleteValueForProperty(getNode(this), propKey)
    }
  }

  for (propKey in nextProps) {
    var nextProp = nextProp[propKey];
    var lastProp = propKey === STYLE ? this._previousStyleCopy : (lastProps != null ? lastProps[propKey] : undefined)

    // 值相等则跳过
    if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
      continue;
    }

    if (propKey === STYLE) {
      if (nextProp) {
        nextProp = this._previousStyleCopy = Object.assign({}, nextProp);
      } else {
        this._previousStyleCopy = null;
      }
      if (lastProp) {
        // 取消 lastProps 上的样式但不取消 nextProps 上的样式
        for (styleName in lastProp) {
          if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
        // 更新来自 lastProp 改变的样式
        for (styleName in nextProp) {
          if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] != nextProp[styleName]) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        // 依赖于 "updateStylesById" 而不是 'styleUpdates'
        styleUpdates = nextProp;
      }
    }
    ...
    else if(DOMProperty.properties[propKey] || DOMProperty.isCustomAttribute(propKey)) {
      var node = getNode(this);
      // 如果要更新为 null 或 undefined，则应该中 DOM 节点中删除该属性，而不是无意中设置为字符串。这与我们在初始渲染时的行为一样。
      if(nextProps != null) {
        DOMPropertyOperations.setValueForProperty(node, propKey, nextProp);
      } else {
        DOMPropertyOperations.deleteValueForProperty(node, propKey);
      }
    }
  }
  if (styleUpdates) {
    CSSPropertyOperations.setValueForStyles(getNode(this), styleUpdates, this);
  }
},

// 主要是两个循环，第一个循环是删除旧的属性，第二个循环是设置新的属性。
// 属性的删除靠的是 DOMPropertyOperations.deleteValueForProperty 或 DOMPropertyOperations.deleteValueForAttribute，
// 属性的设置靠的是 DOMPropertyOperations.setValueForProperty 或 DOMPropertyOperations.setValueForAttribute。
// 已 setValueForAttribute 为例子，最终是调用的 DOM 的 api:

setValueForAttriute: function (node, name, value) {
  if (!isAttributeNameSafe(name)) {
    return;
  }
  if (value == null) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, '' + value);
  }
},

// 针对 style 属性，由 styleUpdates 这个对象来收集变化的信息。它会先将旧的 style 内的所有属性设置为空，
// 然后再用新的 style 来填充。得出新的 style 后调用 CSSPropertyOperations.setValueForStyles 来更新：

setValueForStyles: function (node, styles, component) {
  var style = node.style;
  for (var styleName in styles) {
    ...
    if (styleValue) {
      style[styleName] = styleValue;
    } else {
      ...
      style[styleName] = '';
    }
  }
},

// 接下来看 updateDOMChildren：

updateDOMChildren: function (lastProps, nextProps, transaction, context) {
  var lastContent = CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
  var nextContent = CONTENT_TYPES[typeof nextProps,children] ? nextProps.children : null;
  ...
  if (nextContent != null) {
    if (lastContent !== nextContent) {
      this.updateTextContent('' + nextContent);
    }
  }
  ...
},

// 最终会调用 updateTextContent，这个方法来自 ReactMultiChild，可以简单理解为 ReactDOMComponent 继承了 ReactMultiChild

updateTextContent: function (nextContent) {
  var prevChildren = this._renderedChildren;
  // 去除任何渲染过的子组件
  ReactChildReconiler.unmountChildren(prevChildren, false);

  for (var name in prevChildren) {
    if (prevChildren.hasOwnProperty(name)) {
      invariant(false, '在非空组件上调用 updateTextContent.')
    }
  }
  // 设置新的文本
  var updates = [makeTextContent(nextContext)];
  process(this, updates);
},

function makeTextContainer(textContent) {
  // NOTE: 空值减少隐藏类
  return {
    type: 'TEXT_CONTENT',
    content: textContent,
    formIndex: null,
    fromNode: null,
    toIndex: null,
    afterNode: null,
  };
},

function processQueue(inst, updateQueue) {
  ReactComponentEnvironment.processChildrenUpdates(
    inst,
    updateQueue,
  );
},

// 这里的 ReactComponentEnvironment 通过依赖注入的方式注入后，实际上是 ReactComponentBroswerEnvinonment。
// 最终会调用 DOMChildrenOperations 的 processUpdates：

processUpdates: function (parentNode, updates) {
  for (let k = 0; k < updates.length; k++) {
    var update = updates[k];
    switch (update.type) {
      case 'TEXT_CONTENT':
        setTextContent(
          parentNode,
          update.content
        );
        if (_DEV_) {
          ReactInstrumentation.debugTool.onHostOperation({
            instanceID: parentNodeDebugID,
            type: 'replace text',
            payload: update.content.toString(),
          });
        }
        break;
      default:
        break;
    }
  }
},

// setTextContent.js

var setTextContent = function (node , text) {
  if (text) {
    var firstChildren = node.firstChild;

    if (firstChild && firstChild === node.lastChild && firstChild.nodeType === 3) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
};


// 总结:
// setState流程还是很复杂的，设计也很精巧，避免了重复无谓的刷新组件。它的主要流程如下：
// 1. enqueueSetState 将 state 放入队列中，并调用 enqueueUpdate 处理要更新的 Component；
// 2.如果组件当前正处于 update 事务中，则先将 Component 存入 dirtyComponent中 。否则调用 batchedUpdates 处理。
// 3.batchedUpdates 发起一次 transaction.perform() 事务；
// 4.开始执行事务初始化，运行，结束三个阶段；
//  初始化：事务初始化阶段没有注册方法，故无方法要执行；
//  运行：执行 setSate 时传入的 callback 方法，一般不会传 callback 参数；
//  结束：更新 isBatchingUpdates 为 false，并执行 FLUSH_BATCHED_UPDATES 这个 wrapper 中的close方法。
// 5.FLUSH_BATCHED_UPDATES 在 close 阶段，会循环遍历所有的 dirtyComponents ，调用 updateComponent 刷新组件，并执行它的 pendingCallbacks , 也就是 setState 中设置的 callback。