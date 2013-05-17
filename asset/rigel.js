/**
 * rigel
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * path:    rigel.js
 * desc:    跨项目的实用工具集
 * author:  cxl(chenxinle@baidu.com)
 * depend:  tangram, ecui, e-json
 */

/**
 * rigel命名空间
 * 提供模块管理的define require setDepends 方法
 * 配置项：AUTO_LOAD_MODULE 是否开启模块管理 默认为true
 */
var rigel = (function () {
    var dependPaths = {},   //模块文件路径对应关系
        needLoadPaths = [], //当前需要加载的文件队列
        loadedPaths = [],   //已加载完成的文件队列
        callbacks = [],     //需要执行的回调函数队列
        loading = false,    //当前是否正在加载文件
        
        indexOf = baidu.array.indexOf,
        isIE = baidu.browser.ie,
        blank = function () {};
    
    /**
     * 解析模块定义函数中的依赖
     * 在define函数中搜索rigel.require字符来获取需要在define执行前加载的依赖模块
     *
     * @private
     */
    function parseDependencies(code) {
        var pattern = /\brigel\.require\s*\(\s*['"]?([^'")]*)/g;
        var ret = [], match;
     
        while ((match = pattern.exec(code))) {
            if (match[1]) {
              ret.push(match[1]);
            }
        }
     
        return ret;
    }

    /**
     * 所以依赖加载完成后的回调方法
     * 倒序执行所有之前注册的的回调函数
     *
     * @private
     */
    function loadFinish() {
        var callback;

        while(callback = callbacks.pop()) {
            callback.call(null);
        }
    }

    /**
     * 加载script脚本
     * 通过在head中插入script标签的形式加载脚本文件
     *
     * @private
     */
    function loadScript() {
        var header = document.getElementsByTagName('head')[0],
            ele, path;

        if (!needLoadPaths || needLoadPaths.length <= 0) {
            loadFinish();
            return;
        }

        loading = true;
        ele = document.createElement('script');
        ele.setAttribute('type', 'text/javascript');
        if (isIE) {
            ele.onreadystatechange = function () {
                // loaded JS加载完成并已解析后触发
                // complete JS已解析完成后触发（此时可能由于IE缓存没有重新请求JS文件，因此不会触发loaded）
                // 所以需要同时检测loaded与complete 并且在设置onreadystatechange = null 防止重入
                if (this.readyState == 'loaded' || this.readyState == 'complete') {
                    this.onreadystatechange = null;
                    loadScript.call(null);
                }
            }
        }
        else {
            ele.onload = loadScript;
        }
        path = needLoadPaths.shift();
        loadedPaths.push(path);
        ele.setAttribute('src', path);
        header.appendChild(ele);
    }

    /**
     * 根据路径加载依赖模块
     *
     * @private
     * @param {Array} paths 文件路径
     * @param {Function} callback 加载完成后的回调
     */
    function loadScripts(paths, callback) {
        var path, i;

        // 检查需要加载的文件是否已加载过或者在待加载队列中
        for (i = 0; path = paths[i]; i++) {
            if (indexOf(needLoadPaths, path) < 0 && indexOf(loadedPaths, path) < 0) {
                needLoadPaths.push(path);
            }
        }

        callbacks.push(callback);

        if (!loading) {
            loadScript();
        }
    }

    /**
     * 加载模块
     *
     * @private
     * @param {Array} packages 模块名
     * @param {Function} callback 加载完成后的回调
     */
    function loadPackage(packages, callback) {
        var i, item, paths = [], path;

        for (i = 0; item = packages[i]; i++) {
            path = dependPaths[item];
            if (!path) {
                throw Error('Can find the package:' + item);
            }
            paths.push(path);
        }

        loadScripts(paths, callback);
    }
    
    return {
        /**
         * 模块定义
         *
         * @public
         * @param {String} packageName 模块名
         * @param {Function} define 模块定义函数 原型function (exports) {}， 参数exports为对应的模块命名空间引用
         *                          使用define函数内部请使用exports.abc = function () {}的方式为模块添加导出(公共)方法
         */
        define: function (packageName, define) {
            var levels = packageName.split('.'),
                i, item, ref = window, depends;

            for (i = 0; item = levels[i]; i++) {
                if (!ref[item]) {
                    ref[item] = {};
                }
                ref = ref[item];
            }

            if (rigel.AUTO_LOAD_MODULE && define) {
                depends = parseDependencies(define.toString());
                if (depends.length > 0) {
                    loadPackage(depends, function () {
                        define.call(null, ref);
                    });
                }
                else {
                    define.call(null, ref);
                }
            }
            else if (define) {
                define.call(null, ref);
            }

            return ref;
        },
        
        /**
         * 加载模块 返回模块的引用
         * 如果不是在define函数中使用require 请使用callback参数或者将require语句放在单独的script标签中
         * 以保证后续代码在模块加载完成后执行
         *
         * @public
         * @param {String} packageName 模块名称(define函数定义的模块)
         * @param {Function} callback 模块加载解析完成后的回调函数
         */
        require: function (packageName, callback) {
            var levels = packageName.split('.'),
                ref = window, i = 0,
                callback = callback || blank;

            while (i < levels.length) {
                ref = ref[levels[i++]];
                if (!ref) {
                    break;
                }
            }

            if (!ref) {
                if (rigel.AUTO_LOAD_MODULE) {
                    loadPackage([packageName], callback);
                }
                else {
                    throw new Error(packageName + ' is undefined');
                }
            }
            else {
                callback.call(null);
            }

            return ref;
        },

        /**
         * 设置模块的加载路径
         *
         * @public
         * @param {Object} map 模块-文件路径加载关系
         * @example: {'rigel.dao': '/rigel/dao.js'}
         */
        setDepends: function (map, assetMap, mode) {
            
            var useMap;
            if(mode == 'release') {
                useMap = assetMap;
            }
            else {
                useMap = map;
            }
            
            for (var key in useMap) {
                dependPaths[key] = useMap[key];
            }
        },

        // 是否开启模块管理 配置项
        // 默认为true
        // 如果关闭 define只进行的命名空间申明，require只进行命名空间的引用，文件加载需要手动完成
        AUTO_LOAD_MODULE: true
    }
})();

/**
 * 浮层相关方法
 * 所有浮层实例都是单例
 */
rigel.layer = (function() {

    var dom = baidu.dom, page = baidu.page, 
        eTip = null, bTipMask = false, tipTimer = null;

    function clearTipTimer() {
        if (tipTimer) {
            clearTimeout(tipTimer);
            tipTimer = null;
        }
    }

    return {

        /**
         * 显示tip浮层
         * tip浮层位于可视窗口的顶部 用于显示操作结果的提示信息
         * @public
         *
         * @param {String} text 提示文本
         * @param {Boolean} mask 是否遮罩整个页面可视区域 防止用户操作
         * @param {Number} timeout 自动消失的时间间隔 如果不设置则需要通过调用hideTip来关闭浮层
         */
        tip : function(text, mask, timeout) {
            var x = page.getScrollLeft() + page.getViewWidth() / 2, y = page.getScrollTop() + 5;

            if(!eTip) {
                eTip = dom.create('div', {
                    className : 'rigel-layer-tip loadding-icon',
                    style : 'display:none;'
                });
                document.body.appendChild(eTip);
            }

            clearTipTimer();

            if(eTip.style.display == '') {
                return false;
            }

            eTip.innerHTML = text;
            dom.show(eTip);
            dom.setPosition(eTip, {
                left : x - eTip.offsetWidth / 2,
                top : y
            });
            if(mask) {
                ecui.mask(0);
                bTipMask = true;
            }

            if (timeout) {
                tipTimer = setTimeout(function () {
                    rigel.layer.hideTip();
                }, timeout);
            }
            return true;
        },
        /**
         * 关闭tip浮层
         * @public
         */
        hideTip : function() {
            clearTipTimer();
            dom.hide(eTip);
            if(bTipMask) {
                bTipMask = false;
                ecui.mask();
            }
        },
        /**
         * 显示提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {String} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         */
        alert : function(text, ok) {
            ecui.alert(text, ok);
        },
        
        /**
         * 显示提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {String} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         */        
        
		alertTimer: function (title, text, time) {
			baidu.g ('timerFormTitle').innerHTML = title || '';
			baidu.g ('timerFormInfo').innerHTML = text || '';
			ecui.get ('timerForm').showModal('0.1');
			ecui.get ('timerForm').center();
			setTimeout (function() {
				ecui.get ('timerForm').hide();
			}, time);
		},
        
        /**
         * 显示确认浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {String} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         * @param {Function}  cancel 取消按钮的处理函数
         */
        confirm : function(text, ok, cancel) {
            ecui.confirm(text, ok, cancel);
        },

        /**
         * 警告提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {String} text 警告信息
         * @param {Function} ok 确定按钮的处理函数，如果忽略此参数不会显示确定按钮
         */
        warning: function(text, ok) {
            var html = ['<div class="ui-messagebox-warning-icon"></div>'],
                buttons = ok ? [{text: '确定', className: 'ui-button-g', action: ok}] : [];

            html.push('<div class="ui-messagebox-warning-content"><div class="ui-messagebox-warning-text">' + text + '</div></div>');
            ecui.$messagebox(html.join(''), '警告', buttons, 0.3);
        }
    };
})();

/**
 * 异步请求相关封装
 * 基于e-json, 添加token 重复请求只处理最后一次的返回结果
 * 增加cache,token,queue的管理
 */
rigel.ajax = (function () {

    var contains = baidu.array.contains,
        lastIndexOf = baidu.array.lastIndexOf,
        indexOf = baidu.array.indexOf,
        removeAt = baidu.array.removeAt,
        extend = baidu.object.extend,

        blank = function () {},

        // 请求队列管理
        requestQueue = (function () {
            var queue = [],
                norFlag = '__req__';

            return {
                /**
                 * 添加请求队列
                 * 如果请求的tokenId重复则会被忽略
                 * 如果请求队列在添加前为空 则会显示loading浮层
                 * @public
                 *
                 * @param {String} tokenId 可省略
                 */
                add: function (tokenId) {
                    if (!tokenId || !contains(queue, tokenId)) {
                        queue.push(tokenId || norFlag);
                    }
                },
                
                /**
                 * 减少请求队列
                 * 如果减少后请求队列为空 则会隐藏loading浮层
                 * @public
                 *
                 * @param {String} tokenId 可省略
                 */
                reduce: function (tokenId) {
                    var flag = tokenId || norFlag;
                    removeAt(queue, lastIndexOf(queue, flag));
                }
            };
        })(),

        // 缓存管理
        cacheManager = (function () {
            var cache = {};

            return {
                /**
                 * 生成请求对应的缓存key
                 * 根据URL和参数来唯一标识一个请求
                 * @public
                 *
                 * @param {String} url
                 * @param {String} params 请求参数
                 * @return {String}
                 */
                generateKey: function(url, params) {
                    if (params) {
                        url += (url.indexOf('?') >= 0 ? '&' : '?') + params;
                    }

                    return encodeURIComponent(url);
                },

                /**
                 * 设置缓存
                 * @public
                 *
                 * @param {String} key
                 * @param {Any}    data 请求返回的数据
                 * @param {Object} reponse 请求返回的E-JSON数据
                 * @return {Object} 缓存数据
                 */
                set: function (key, data, reponse) {
                    cache[key] = {data: data, reponse: reponse};
                    return cache[key];
                },

                /**
                 * 获取缓存
                 * @public
                 *
                 * @param {String} key
                 * @return {Object} 缓存数据
                 */
                get: function (key) {
                    return cache[key];
                }
            }
        })(),

        // token管理
        tokenManager = (function () {
            var tokens = [];

            return {
                generate: function (tokenId) {
                    if (!tokens[tokenId]) {
                        tokens[tokenId] = 0;
                    }
                    return ++tokens[tokenId];
                },

                get: function (tokenId) {
                    return tokens[tokenId];
                },

                valiate: function (token, tokenId) {
                    return !!token ? token == tokens[tokenId] : true;
                }
            };
        })(),

        defaultErrorHandler = {
            def: blank
        };

    function addParams4URL(url, params) {
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + params;
    }

    /**
     * 生成GUID
     * @private
     *
     * @refer http://goo.gl/0b0hu
     */
    function createGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 异步请求
     * 暂时只支持POST与GET请求
     */
    function request(url, options) {
        var success = options.onsuccess || blank,
            fail = options.onfailure || blank, o,
            cacheKey = cacheManager.generateKey(url, options.data);

        // 如果请求已被缓存 则直接从缓存中获取数据
        if (options.cache && (o = cacheManager.get(cacheKey))) {
            success.call(null, o.data, o.reponse);
            return;
        }

        // 修正请求参数
        // GET 添加时间戳防止浏览器强制缓存
        // POST 如果没有参数则添加时间戳 防止后端出于安全考虑屏蔽无参数的POST请求
        if (options.method == 'get') {
            url = addParams4URL(url, 'req=' + (new Date()).getTime());
        }
        else if (!options.data) {
            options.data = 'req=' + (new Date()).getTime();
        }

        // 成功回调函数
        options.onsuccess = function (data, obj) {
            // 如果token验证失败则忽略次此请求
            if (!tokenManager.valiate(obj.token, options.tokenId)) {
                return;
            }

            if (options.cache) {
                cacheManager.set(cacheKey, data, obj);
            }

            success.call(options.context ? options.context : null, data, obj);
            
            // 请求已完成，减少请求队列数
            if (options.queue !== false) {
                requestQueue.reduce(options.tokenId);
            }
        };

        // 失败回调函数
        options.onfailure = function (status, obj) {
            var errorHanlder,
                defaultErrorHandler = rigel.ajax.DEFAULT_ERROR_HANDLER;

            // 如果token验证失败则忽略次此请求
            if (!!obj && !tokenManager.valiate(obj.token, options.tokenId)) {
                return;
            }

            // 请求已完成，减少请求队列数
            if (options.queue !== false) {
                requestQueue.reduce(options.tokenId);
            }

            // 如果自定义错误处理函数返回false则阻止默认的错误处理
            if (fail && fail.call(options.context ? options.context : null, status, obj) === false)  {
                return; 
            }

            // 调用默认错误处理函数
            errorHanlder = defaultErrorHandler[status] || defaultErrorHandler['def'];
            errorHanlder.call(null, status, obj);
        };

        // 为请求添加token
        if (options.tokenId) {
            o = tokenManager.generate(options.tokenId);
            if (options.method == 'get') {
                url = addParams4URL(url, 'token=' + o);
            }
            else {
                options.data += '&token=' + o;
            }
        }

        // 添加请求队列 发起请求
        if (options.queue !== false) {
            requestQueue.add(options.tokenId);
        }
        baidu.ejson.request(url, options);
    }

    return {
        /**
         * 发起异步请求, 返回的数据要求为e-json格式
         * @public 
         *
         * @param {String} url 请求的url
         * @param {Object} options 异步请求参数 在tangram的异步请求参数的基础上增加了如下参数:
         *          {Boolean}   cache   是否程序级开启缓存 （以示与浏览器缓存分别），如果开启则在有缓存的情况下不会发起异步请求，默认为false
         *          {String}    tokenId 请求唯一ID，如果使用此参数则HTTP请求参数与返回的数据中都会有token字段，用于防止重复提交多次响应的问题
         *          {Boolean}   queue   是否将请求加入管理队列，如果加入则会统一管理loading浮层，默认true
         *          {Object}    context 自定义异步回调函数(success, fail)的执行上下文，默认为null
         */
        request: function (url, options) {
            request(url, !!options ? extend({}, options) : {method: 'get'});
        },
        
        /**
         * 发起GET请求
         * 会开启队列管理功能, 关闭cache与token特性
         * @public
         * 
         * @param {String} url 请求url
         * @param {Function} onsuccess 成功回调函数
         * @param {function} onfailure 失败回调函数
         */
        get: function (url, onsuccess, onfailure) {
            request(url, {
                method      : 'get', 
                onsuccess   : onsuccess, 
                onfailure   : onfailure
            });
        },

         /**
         * 发起POST请求
         * 会开启队列管理功能, 关闭cache与token特性
         * @public
         * 
         * @param {String} url 请求url
         * @param {Data} 请求参数
         * @param {Function} onsuccess 成功回调函数
         * @param {function} onfailure 失败回调函数
         */
        post: function (url, data, onsuccess, onfailure) {
            request(url, {
                method      : 'post', 
                data        : data,
                onsuccess   : onsuccess, 
                onfailure   : onfailure
            });
        },

        /**
         * 创建异步请求函数
         * 如果需要使用token特性的话请使用该方法创建一个固化了uuid的异步请求函数
         *
         * @public
         * @param {Function} callback 参数处理函数，返回异步去请求需要的参数options
         * @param {Object} options 默认的异步请求参数 会将callback返回的options与此默认参数进行合并得到最终的异步请求参数
         * @param {Object} context callback函数执行时的上下文对象
         * @return {Function} 异步请求函数
         */
        dao: function (callback, options, context) {
            var context = context || null,
                defaultOptions = options || {},

                extend = baidu.object.extend;

            if (defaultOptions.token) {
                defaultOptions.tokenId = createGUID(); 
                delete defaultOptions.token;
            }

            return function () {
                var res = callback.apply(context, Array.prototype.slice.call(arguments)),
                    options = extend({}, defaultOptions);
                
                extend(options, res);
                if (!options.method) {
                    options.method = 'get';
                }
                !!options.url && request(options.url, options);
            }
        },

        /**
         * 默认全局错误处理函数集合(Map)
         * key为对应的错误编码（e-json中的status）
         * def为全局默认的处理函数
         * @public
         */
        DEFAULT_ERROR_HANDLER: {
            def: blank
        }
    }
})();

rigel.utils = (function () {
    var encodeHTML = baidu.string.encodeHTML,
        G = baidu.dom.g;

    /**
     * 向缓冲区添加参数数据
     * @private
     */
    function addData(name, value, data) {
        var val = data[name];
        if(val){
            val.push || ( data[name] = [val] );
            data[name].push(value);
        }else{
            data[name] = value;
        }
    }

    function setFormCheckedData(items, data) {
        var map = {}, i, item;

        if (Object.prototype.toString.call(data) != '[object Array]') {
            data = [data];
        }

        for (i = 0; item = items[i]; i++) {
            map[item.value] = item;
            item.checked = false;
        }

        for (i = 0, item = data.length; i < item; i++) {
            map[data[i]] && (map[data[i]].checked = true);
        }
    }

    function setFormItemData(item, data) {
        var i, tagName = item.tagName.toLowerCase();
        if (tagName == 'select') {
            for (i = 0; i < item.length; i++) {
                if (item[i].value == data) {
                    item.selectedIndex = i;
                    break;
                }
            }
        }
        else {
            item.value = data;
        }
    }

    return {
        /**
         * 剪切本文，超出长度后出title提示
         *
         * @public
         */
        cutContent: function (str, maxlength) {
            if (str.length <= maxlength) {
                return encodeHTML(str);
            }
            else {
                return '<span title="'+ str +'">' + encodeHTML(str.substring(0, maxlength)) + '...</span>';
            }
        },

        /**
         * 将form内的内容JSON化
         * 从tangram中抽离 取消对value的编码处理
         *
         * @public
         */
        jsonForm: function (form, replacer) {
            var elements = form.elements,
                replacer = replacer || function (value, name) {
                    return value;
                },
                data = {},
                item, itemType, itemName, itemValue, 
                opts, oi, oLen, oItem;
                
            for (var i = 0, len = elements.length; i < len; i++) {
                item = elements[i];
                itemName = item.name;
                
                // 处理：可用并包含表单name的表单项
                if (!item.disabled && itemName) {
                    itemType = item.type;
                    itemValue = item.value;
                
                    switch (itemType) {
                    // radio和checkbox被选中时，拼装queryString数据
                    case 'radio':
                    case 'checkbox':
                        if (!item.checked) {
                            break;
                        }
                        
                    // 默认类型，拼装queryString数据
                    case 'textarea':
                    case 'text':
                    case 'password':
                    case 'hidden':
                    case 'file':
                    case 'select-one':
                        addData(itemName, replacer(itemValue, itemName), data);
                        break;
                        
                    // 多行选中select，拼装所有选中的数据
                    case 'select-multiple':
                        opts = item.options;
                        oLen = opts.length;
                        for (oi = 0; oi < oLen; oi++) {
                            oItem = opts[oi];
                            if (oItem.selected) {
                                addData(itemName, replacer(oItem.value, itemName), data);
                            }
                        }
                        break;
                    }
                }
            }
            return data;
        },

        /**
         * 回填form
         *
         * @public
         */
        fillForm: function (form, data, controlMap) {
            var i, item, key;

            if (typeof form == 'string') {
                form = G(form);
            }

            for (key in data) {
                item = form[key];
                if (controlMap && controlMap[key] && ecui.get(controlMap[key])) {
                    ecui.get(controlMap[key]).setValue(data[key]);
                }
                else if (item) {
                    if (item.length && !item.tagName) {
                        setFormCheckedData(item, data[key]);
                    }
                    else {
                        setFormItemData(item, data[key]);
                    }
                }
            }
        }
    }
})();

rigel.validate = {
    isEMAIL: function (value) {
        return /^[_\w-]+(\.[_\w-]+)*@([\w-])+(\.[\w-]+)*((\.[\w]{2,})|(\.[\w]{2,}\.[\w]{2,}))$/.test(value);
    },
    
    isURL:  function (value) {
        return /^[^.。，]+(\.[^.，。]+)+$/.test(value); 
    },

    isZipCode: function (value) {
        return /^\d{6}$/.test(value);
    },

    isMobile: function (value) {
        return /^1\d{10}$/.test(value);
    }
}

/*
 * 定义缩写
 */
rigel.alert = rigel.layer.alert;
rigel.confirm = rigel.layer.confirm;
rigel.warning = rigel.layer.warning;
