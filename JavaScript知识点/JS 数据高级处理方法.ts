// ① Map 处理成数组，并且把 Map 的每一个 Key 值加入每一项中：

const enum State {
    InProcess,
    End,
    Cancel,
    Stop,
}

const StateMap = {
    [State.InProcess]: {
        label: '待完成',
        color: 'red',
    },
    [State.End]: {
        label: '结束',
        color: 'green',
    },
    [State.Cancel]: {
        label: '取消',
        color: 'blue',
    },
    [State.Stop]: {
        label: '停止',
        color: 'black',
    }
}

const array = Object.entries(StateMap).map(([key, v]) => ({...v, key}));

console.log(array);