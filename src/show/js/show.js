/**
 * 展现页面逻辑
 */

var uiManager = uiManager || {};

uiManager.show = (function(){

    var nowAt = window.location.hash.replace('#', '');

    //获取组件列表
    var listData = uiManager.UIComponentList;
    var htmls = [];
    var selected = null;

    baidu.each(listData, function(item) {
        if(nowAt && item.link == nowAt) {
            selected = item;
        }
        htmls.push('<li link="' + item.link + '">' +item.name+ '</li>');
    });

    if(!nowAt) {
        nowAt = listData[0].link;
        window.location.hash = nowAt;
        var text = listData[0].name;
        baidu.g('uiName').innerHTML = text;
        baidu.g('content').src = 'src/show/demos/' + nowAt + '.html';
    }
    else {

        var text = selected.name;
        baidu.g('uiName').innerHTML = text;
        baidu.g('content').src = 'src/show/demos/' + nowAt + '.html';

    }
    
    baidu.g('left-navi-list').innerHTML = htmls.join('');



    //点击左侧菜单的时候 右侧出现详细信息
    baidu.on(baidu.g('navi-list'), 'click', function(e) {

        var evt = window.event || e;
        var target = baidu.event.getTarget(evt);

        if(target.nodeName == 'LI') {

            var link = baidu.dom.getAttr(target, 'link');
            baidu.g('uiName').innerHTML = target.innerHTML;
            baidu.each(baidu.dom.query('.left-navi>li'), function(naviItem) {
                baidu.dom.removeClass(naviItem, 'nowAt');
            });
            baidu.dom.removeClass(baidu.g('navi-content'), 'right-navi-changing');
            baidu.g('content').src = 'src/show/demos/' + link + '.html';
            window.location.hash = link;
        }
    });


    baidu.g('content').onload = function() {
        baidu.dom.addClass(baidu.g('navi-content'), 'right-navi-changing');
    };
    

})();
