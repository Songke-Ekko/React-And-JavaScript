// https://yangbo5207.github.io/2016/03/29/notification.html

// title: 表示提示的标题
// body: 提示的描述信息
// icon: 提示的头像
// dir: 设置消息的排列方向，auto 自动 ltr 左向右 rtl 右向左
// tag: 为消息添加标签，如果新消息出现时，标签相同，会替换老的标签，不会重复
// onshow： 当消息框显示时执行事件
// onclick: 点击消息框时执行
// onclose: 关闭消息框时执行
// onerror: 出现错误时触发

if (window.Notification) {
    // var trend = personal.trend < 0 ? personal.trend : '+' + personal.trend;
    var avatar = personal.avatar || '/static/images/cooperation/stockGame/init-avatar.png';
    var title = '老虎证劵炒股大赛';
    if (Notification.permission === 'granted') {
        if (personalRank != 0) {
            var notification = new Notification(title, {
                body: personal.nickname + ' 当前排名：' + personal.rank + '  收益：' + rate,
                icon: avatar,
                dir: 'auto',
                tag: 'tigerbrokers'
            });
        }
    } else {
        Notification.requestPermission();
    }
}

