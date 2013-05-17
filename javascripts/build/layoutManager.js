//底部布局管理器
var build = build || {};
build.layoutManager = {
    'clearLayoutTabNowAt' : function() {
        baidu.each(baidu.dom.query('.layout-panel-tab-title'), function(frame) {
            baidu.dom.removeClass(frame, 'layout-panel-tab-title-nowat');
        });
    },
    'setLayoutTabNowAt' : function(target) {
        build.layoutManager.clearLayoutTabNowAt();
        baidu.dom.addClass(target, 'layout-panel-tab-title-nowat');
    },
    'requestLayoutTab' : function(data) {
        var data = [
                    {
                        'name' : '布局',
                        'target' : 'layout'
                    },
                    {
                        'name' : '控件',
                        'target' : 'control'
                    }
                ];
        var tabs = [];
        baidu.each(data, function(item) {
            tabs.push('<span target="' + item.target + '" class="layout-panel-tab-title">' + item.name + '</span>');
        });
        baidu.g('layout-panel-title').innerHTML = tabs.join('');

        baidu.on('layout-panel-title', 'click', function(e) {
            var evt = e || window.event;
            var target = baidu.event.getTarget(evt);
            var panelTarget = baidu.dom.getAttr(target, 'target');
            if (panelTarget) {

                baidu.each(baidu.dom.query('.layout-panel-tab-title-nowat'), function(item) {
                    baidu.dom.removeClass(item, 'layout-panel-tab-title-nowat');
                });
                baidu.dom.addClass(target, 'layout-panel-tab-title-nowat');

                baidu.each(baidu.dom.query('.mng-panel'), function(item) {
                    baidu.dom.hide(item);
                });
                baidu.dom.show(panelTarget + '-mng-panel');
            }
        });
        baidu.dom.query('.layout-panel-tab-title')[0].click();
        build.layoutManager.bindLayoutPanel();
    },
    'bindLayoutPanel' : function() {
        baidu.on('layout-mng-panel', 'click', function(e) {
            var evt = e || window.event;
            var target = baidu.event.getTarget(evt);
            if (target.nodeName == 'IMG') {
                /layout_(.*)\.png/.test(baidu.dom.getAttr(target, 'src'));
                var layoutId = RegExp.$1;
                if (baidu.dom.query('.frame-nowat').length) {
                    var nowAtFrame = baidu.dom.query('.frame-nowat')[0];

                }
                else {
                    alert('请选择需要布局的容器');
                }
            }
        });
    },

    'refreshLayoutPanel' : function (data, index) {

    },

    //'create':

}
