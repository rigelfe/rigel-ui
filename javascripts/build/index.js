var build = build || {};

baidu.dom.ready(function() {
	build.layoutManager.requestLayoutTab();
});



baidu.on(window, 'click', function(e) {
    var evt = e || window.event;
    var target = evt.target;
                
    if (!target) {
        return ;
    }

    if (baidu.dom.hasClass(target, 'frame')) {
        if (baidu.dom.hasClass(target, 'frame-nowat')) {
            build.frameManager.clearFrameNowAt();
        }
        else {
            build.frameManager.setFrameNowAt(target);
        }
        return ;
    }

    if(baidu.dom.hasClass(target, 'layout-panel-tab-title')) {
        build.layoutManager.clearLayoutTabNowAt();
        build.layoutManager.setLayoutTabNowAt(target);
        return ;
    }

});