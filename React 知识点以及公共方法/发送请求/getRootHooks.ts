import { SyncBailHook, SyncWaterfallHook, Hook, SyncHook } from 'tapable'
type AnyComponent = React.Component<any, any>

const getRootHooks = () => {
  const rootHooks = {
    routes: {
      index: new SyncWaterfallHook(['acc', 'Route']),
      workspace: new SyncWaterfallHook(['acc', 'Route']),
    },
    audit: {
      handler: new SyncBailHook(['message']),
      handlerModal: new SyncBailHook(['message'])
    },

    announcement: {
      // 发布 - 创建发布
      headTools: new SyncBailHook(['affair', 'context']),
      filterHiddenItems: new SyncBailHook(['affair', 'filters']),
      filter: {
        specificTypeSelector: new SyncBailHook(['component']),
      },
      list: {
        fetchConfig: new SyncBailHook(['affair', 'commenConfig']),
      },
      create: {
        template: new SyncBailHook(['affair', 'targetId', 'target']),
        content: new SyncBailHook(['templateType', 'plateSubType', 'context']),
        fetch: new SyncBailHook(['plateType', 'plateSubType', 'commonFields', 'options', 'context']),
        defaultTemplate: new SyncBailHook(['context']),
        initialize: new SyncBailHook<{ component: AnyComponent }>(['component', 'formatFileId']),
        whetherTemplateNeeded: new SyncBailHook<{ component: AnyComponent }>(['component']),
        saveDraftFetch: new SyncBailHook(['context']),
        regularlySaveDraftFetchUrl: new SyncBailHook(['plateType', 'plateSubType']),
        whetherHideDelay: new SyncBailHook<{ component: AnyComponent }>(['component']),
        whetherHideDraft: new SyncBailHook<{ component: AnyComponent }>(['component']),
        defaultPublicType: new SyncBailHook(['affair', 'context']),
        notValidateRichText: new SyncBailHook(['affair', 'option']),
        attachment: {
          hideRepo: new SyncBailHook(['context']),
          syncRepoId: new SyncBailHook(['context']),
        },
        titleInput: new SyncBailHook(['plateType', 'plateSubType', 'context']),
        getCandidateNumber: new SyncBailHook(['context']),
        // hideAttachmentRepo: new SyncBailHook(['context']),
      },
      // 发布 - 发布详情
      detail: {
        fetchTypicalAnnouncement: new SyncHook<{ affair: any, announcement: any, component: AnyComponent }>(['fetchConfig']),
        launch: new SyncBailHook<{ affair: any, announcement: any, component: AnyComponent }>(['option']),
        hideChatPanel: new SyncBailHook(['announcement']),
        hideFollowersCount: new SyncBailHook(['announcement']),
        hidePlanTime: new SyncBailHook(['announcement']),
        hideHistory: new SyncBailHook(['announcement']),
        bodyDecorator: new SyncBailHook(['announcement', 'affair', 'context', 'timeList']),
        otherHeaderTools: new SyncBailHook(['announcement', 'acc', 'context']),
        announcementTabsDecorator: new SyncBailHook(['announcement', 'tabPanes', 'context']),
        contentWrapperTool: new SyncBailHook(['announcement', 'affair', 'context']),
        recover: new SyncBailHook(['announcement', 'affair']),
        invalid: new SyncBailHook(['announcement', 'affair']),
        menuItemsText: new SyncBailHook(['announcement']),
        menuItems: new SyncWaterfallHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
          menuItems: Array<{ key: string, name: string, handler: () => void | Promise<any> }>
        }>(['menuItemsConfig']),
        hideCmtPermission: new SyncBailHook(['affair']),
        whetherHideMove: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['moveItemConfig']),
        whetherHideEdit: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['editItemConfig']),
        whetherHideFinish: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['finishItemConfig']),
        whetherHideInvalidate: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['invalidateItemConfig']),
        whetherHideRecover: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['recoverItemConfig']),
        whetherHideChangePublicity: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['changePublicityItemConfig']),
        whetherHideHistory: new SyncBailHook<{
          affair: any,
          announcement: any,
          component: AnyComponent,
        }>(['historyConfig']),
        whetherShowEndTime: new SyncBailHook(['announcement', 'targetId', 'context']),
        whetherHideTags: new SyncBailHook(['announcement', 'affair']),

        fetch: new SyncBailHook(['detailId', 'options', 'context']),
        whetherShowDownloadBatch: new SyncBailHook(['announcement', 'context']),
        hideJoinBtn: new SyncBailHook(['announcement']),
        hideStarBtn: new SyncBailHook(['announcement']),
        task: {
          getTaskRoles: new SyncBailHook(['announcement', 'targetId', 'context']),
          fetchTypicalTask: new SyncBailHook(['announcement', 'targetId', 'context']),
        },
        homeworkCount: new SyncBailHook(['announcement', 'context']),
      },

      participant: {
        official: {
          labelText: new SyncBailHook(['affair', 'announcement']),
        },
        guest: {
          labelText: new SyncBailHook(['affair', 'announcement']),
        },
      },
      draft: {
        fetchDetails: new SyncBailHook(['draftId', 'plateType', 'plateSubType', 'context']),
      },
      move: {
        candidates: new SyncBailHook<{ component: AnyComponent }>(['component'])
      },
      tssAnnouncement: new SyncBailHook(['context']),
      tssAnnouncementDetail: new SyncBailHook(['context', 'announcement', 'reFetchDetail']),
    },
    homepage: {
      router: new SyncBailHook(['affair', 'type']),
      needToFreshCourse: new SyncBailHook(['pre', 'next']),
      tssAuthorityJudge: new SyncBailHook(['context', 'operationType']),
      tssOperationURL: new SyncBailHook(['operationType'])
    },
    role: new SyncBailHook(['affair', 'pushURL', 'updateChatRole']),
    tss: {
      // tss下组件
      memberContainer: new SyncBailHook(['affair', 'pushURL', 'updateChatRole']),
      groupContainer: new SyncBailHook(['affair', 'userId', 'pushURL']),
      homepage: {
        router: new SyncBailHook(['affair', 'pushURL', 'location', 'fetchAffairList', 'getAffairInfo']),
      },
      message: new SyncBailHook(['notificationList', 'role', 'notificationListState', 'messageMode', 'func'])
    },
    menkor: {
      // 各个行业线需要往盟客网注册的路由
      routes: new SyncWaterfallHook<{ acc: Array<any>, Route: any }>(['option']),
      // 定义盟客网搜索事务的搜索结果中，点击事务所进行的行为
      // 需求说点击搜索结果的事务，跳转事务详情，是新开tab，所以用window.openHashUrl（这个pushURL参数暂时用不到）
      clickSearchAffairResult: new SyncBailHook(['affair', 'pushURL']),
    },
    // 目标
    target: {
      create: {
        template: new SyncBailHook(['affair']),
        content: new SyncBailHook<{ component: AnyComponent }>(['component']),
        fetch: new SyncBailHook(['plateType', 'commenFields', 'context']),
      },
      list: {
        filter: new SyncBailHook(['affair', 'context']),
        initialize: new SyncBailHook(['affair', 'context']),
        fetch: new SyncBailHook(['affair', 'context', 'params']),
      },
      detail: {
        get: new SyncBailHook(['affair', 'target', 'context']),
        components: {
          description: new SyncBailHook(['target', 'affair', 'context']),
          operation: new SyncBailHook(['target', 'affair', 'context']),
          joinWay: new SyncBailHook(['target', 'affair', 'context']),
          count: new SyncBailHook(['target', 'svg']),
          resource: new SyncBailHook(['target', 'affair', 'context', 'files', 'currentTab']),
          courseTypeTag: new SyncBailHook(['target', 'tag', 'key', 'context']),
        },
        update: new SyncBailHook(['target', 'affair', 'callback']),
        changeAdmin: new SyncBailHook(['target', 'affair', 'callback']),
        deleteCourse: new SyncBailHook(['target', 'affair', 'callback']),
        announcement: {
          addWay: new SyncBailHook(['target', 'affair', 'context']),
          whetherHideDraft: new SyncBailHook(['target', 'affair', 'context']),
          plateList: new SyncBailHook(['target']),
          listItem: new SyncBailHook(['target', 'affair', 'announcement', 'context']),
        },
        task: {
          whetherHideOpt: new SyncBailHook(['target']),
          addWay: new SyncBailHook(['target', 'affair', 'context'])
        },
        roles: {
          initialize: new SyncBailHook(['target', 'context', 'callback']),
          change: new SyncBailHook(['target', 'options', 'context']),
        },
        fetchTypicalTarget: new SyncBailHook(['affair', 'target', 'context']),
        whetherHideMoreIcon: new SyncBailHook(['target']),
        whetherHideResource: new SyncBailHook(['affair', 'target', 'context']),
      },
      url: new SyncBailHook([]),
      hideInvalidate: new SyncBailHook(['context']),
      hideFinish: new SyncBailHook(['context']),
      hideRecover: new SyncBailHook(['context']),
      hideReopen: new SyncBailHook(['context']),
      substitute: {
        text: new SyncBailHook(['target'])
      },
      audit: {
        applyModal: new SyncBailHook(['context'])
      },
      // getPermissions: new SyncBailHook(['target']),
    },
    // 任务
    task: {
      detail: {
        taskOpt: new SyncBailHook(['task', 'context']),
        announcementInfo: new SyncBailHook(['context']),
        fetchTypicalTask: new SyncBailHook(['task', 'context'])
      },
      create: {
        initialize: new SyncBailHook(['affair', 'announcement', 'context']),
        fetchCandidates: new SyncBailHook(['options', 'context']),
      },
    },
    // 资源
    resource: {
      repoOptions: new SyncBailHook(['affair']),
      hideFund: new SyncBailHook(['affair']),
      hideAssets: new SyncBailHook(['affair']),
      batchAddMember: new SyncBailHook(['affair', 'context']),
    },
    callHook: (hookId: string, ...args) => { return null as any },
    tapHook: (hookId: string, hookName: string, fn) => { return },
    createHook: (hookId: string, hook: Hook) => { return },
    createSyncBailHook: (hookId: string, ...args) => { return },
    getHook: (hookId: string) => { return },
    tapable: null as any
  }

  const findLegacyHook = (hookId) => {
    hookId = hookId.split('.')
    let hook = rootHooks

    for (let i = 0; i < hookId.length; i++) {
      if (hook[hookId[i]]) {
        hook = hook[hookId[i]]
      } else {
        return null
      }
    }

    return hook
  }

  const _internalHook = {}
  let _defferTap = []

  rootHooks.callHook = (hookId, ...args) => {
    if (hookId) {
      let hook = findLegacyHook(hookId) || _internalHook[hookId]

      if (hook) {
        return hook.call(...args)
      }
    }
  }

  rootHooks.tapHook = (hookId, hookName, fn) => {
    if (hookId) {
      let hook = findLegacyHook(hookId) || _internalHook[hookId]

      if (hook) {
        return hook.tap(hookName, fn)
      } else {
        _defferTap.push([hookId, hookName, fn])
      }
    }
  }

  rootHooks.getHook = (hookId) => {
    if (hookId) {
      let hook = findLegacyHook(hookId) || _internalHook[hookId];
      return {
        hook,
        taps: hook ? hook.taps : [],
      };
    }
  }

  rootHooks.createSyncBailHook = (hookId, ...args) => {
    rootHooks.createHook(hookId, new SyncBailHook(args));
  }

  rootHooks.createHook = (hookId, hook) => {
    if (rootHooks[hookId] || findLegacyHook(hookId)) {
      console.error(`创建了重复的插件: ${hookId}`)
    } else {
      _internalHook[hookId] = hook

      _defferTap = _defferTap.map(tap => {
        if (tap[0] === hookId) {
          hook.tap(tap[1], tap[2])
          return null
        } else {
          return tap
        }
      }).filter(v => !!v)
    }
  }

  rootHooks.tapable = require('tapable')
  return rootHooks
}
const _instance = getRootHooks()
/* rootHooks的类型声明 */
export type RootHooksType = typeof _instance
/* rootHooks注册器的声明，需要接收一个rootHooks并进行挂载 */
export type RootHooksRegister = (rootHooks: RootHooksType) => void
export {
  _instance as rootHooks
}
