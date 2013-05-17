var build = build || {};

build.dao = (function() {

    var funcList = {
        getUIComponentList : 'UIComponent/getUIComponentList.action',
        getUIComponentDemo : 'UIComponent/getUIComponentDemo.action'
    };

    for(var func in funcList) {
        var url = funcList[func];
        funcList[func] = new Function('data', 
                                        'onsuccess', 
                                        'onfailure', 
                                        'var url="' + url + '";' 
                                        + 'rigel.ajax.post(url, baidu.url.jsonToQuery(data, encodeURIComponent), onsuccess, onfailure);');
    };

    return funcList;
})();