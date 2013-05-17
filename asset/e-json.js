/*
 * e-json
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    e-json.js
 * desc:    提供E-JSON标准格式的请求与解析功能
 *          扩展添加token
 * author:  erik
 * depend:  baidu.ajax.request, baidu.json.parse
 */

/**
 * E-JSON标准格式的请求与解析功能
 */
baidu.ejson = function () {
    /**
     * 发送一个数据格式为E-JSON标准的请求
     *
     * @inner
     */
    function request(url, options) {
        var onsuccess = options.onsuccess;
        var onfailure = options.onfailure;

        // 包装baidu.ajax.request的success回调
        options.onsuccess = function (xhr) {
            process(xhr.responseText, onsuccess, onfailure);
            options = null;
        };

        // 状态码异常时，触发e-json的proccess，status为请求返回的状态码
        options.onfailure = function (xhr) {
            process({
                    status: xhr.status,
                    statusInfo: xhr.statusText,
                    data: xhr.responseText
                },
                onsuccess,
                onfailure);
            options = null;
        };

        return baidu.ajax.request(url, options);
    }

    /**
     * 解析处理E-JSON标准的数据
     *
     * @inner
     */ 
    function process(source, onsuccess, onfailure) {
        onfailure = onfailure || new Function();
        onsuccess = onsuccess || new Function();

//        //测试用，防止自定义用例不符合json规范，正式联调时去掉
//        baidu.json.parse = function(source){
//            return eval("(" + source + ")");
//        };
//        
        var obj = typeof source == 'string' ? baidu.json.parse(source) : source;
        // 不存在值或不为Object时，认为是failure状态，状态码为普通异常
        if (!obj || typeof obj != 'object') {
            onfailure(1, obj);
            return;
        }

        // 请求状态正常
        if (!obj.status) {
            onsuccess(obj.data, obj);
        } else {
            onfailure(obj.status, obj);
        }
    }
 
    return {        
        /**
         * 发送一个数据格式为E-JSON标准的请求
         * 
         * @public
         * @param {string} url 发送请求的url
         * @param {Object} options 发送请求的可选参数
         */
        request: request,
        
        /**
         * 通过get的方式请求E-JSON标准的数据
         * 
         * @public
         * @param {string}   url 发送请求的url
         * @param {Function} onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function} onfailure 状态异常的处理函数，(异常状态码，整体数据)
         */
        get: function (url, onsuccess, onfailure) {
            request(url, 
                {
                    method      : 'get', 
                    onsuccess   : onsuccess, 
                    onfailure   : onfailure
                });
        },
        
        /**
         * 通过post的方式请求E-JSON标准的数据
         *
         * @public
         * @param {string} url         发送请求的url
         * @param {string} postData    post发送的数据
         * @param {Function} onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function} onfailure 状态异常的处理函数，(异常状态码，整体数据)
         */
        post: function (url, postData, onsuccess, onfailure) {
            return request(url, 
                {
                    method      : 'post', 
                    data        : postData, 
                    onsuccess   : onsuccess, 
                    onfailure   : onfailure
                });
        },

        /**
         * 解析处理E-JSON标准的数据
         *
         * @public
         * @param {string|Object}   source    数据对象或字符串形式
         * @param {Function}        onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function}        onfailure 状态异常的处理函数，(异常状态码，整体数据)
         */
        process: process
    };
}();


