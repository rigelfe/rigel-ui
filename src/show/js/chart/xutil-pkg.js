/**
 * xutil-pkg
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:   工程直接使用的工具集
 *          在基础提供的工具函数之外，可根据每个工程需要添加工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 */

/**
 * @namespace
 */
var xutil = {
    lang: {},
    number: {},
    string: {},
    fn: {},
    object: {},
    date: {},
    url: {},
    collection: {},
    file: {},
    dom: {},
    uid: {},
    graphic: {},
    ajax: {}
};

//==============================================================
// lang
//==============================================================

/**
 * xutil.lang
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    基本工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  xutil.lang, xutil.string
 */

(function () {
    
    var LANG = xutil.lang;
    var STRING = xutil.string;
    var objProto = Object.prototype;
    var objProtoToString = objProto.toString;
    var hasOwnProperty = objProto.hasOwnProperty;

    /**
     * 判断变量是否为string
     * 
     * @public
     * @param {*} variable 输入变量
     * @return {boolean} 判断结果
     */    
    LANG.isString = function (variable) {
        return objProtoToString.call(variable) == '[object String]';
    };
    
    /**
     * 判断是否为Object
     * 
     * @public
     * @param {*} variable 输入变量
     * @return {boolean} 判断结果
     */    
    LANG.isObject = function (variable) {
         return variable === Object(variable);
    };
    
    /**
     * 判断是否为Date
     * 
     * @public
     * @param {*} variable 输入变量
     * @return {boolean} 判断结果
     */    
    LANG.isDate = function (variable) {
        return objProtoToString.call(variable) == '[object Date]';
    };  

})();

//==============================================================
// string
//==============================================================

/**
 * xutil.string
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    字符串相关工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  xutil.lang
 */

(function () {
    
    var STRING = xutil.string;
    var TRIMER = new RegExp(
            "(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g"
        );
    
    /**
     * 删除目标字符串两端的空白字符 (@see tangram)
     * 
     * @pubilc
     * @param {string} source 目标字符串
     * @returns {string} 删除两端空白字符后的字符串
     */
    STRING.trim = function (source) {
        return source == null 
            ? ""
            : String(source).replace(TRIMER, "");
    };
    
    /**
     * 对目标字符串进行html编码 (@see tangram)
     * 编码字符有5个：&<>"'
     * 
     * @public
     * @param {string} source 目标字符串
     * @returns {string} html编码后的字符串
     */
    STRING.encodeHTML = function (source) {
        return String(source)
                    .replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
    };
        
  })();

//==============================================================
// dom
//==============================================================

/**
 * xutil.dom
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    DOM相关工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 */

(function () {
    
    var DOM = xutil.dom;
    var USER_AGENT = navigator.userAgent;
    var DOCUMENT = document;
    var REGEXP = RegExp;

    DOM.ieVersion = /msie (\d+\.\d)/i.test(USER_AGENT) 
        ? DOCUMENT.documentMode || (REGEXP.$1 - 0) : undefined;
    
    /**
     * 为 Element 对象添加新的样式。
     * 
     * @public
     * @param {HTMLElement} el Element 对象
     * @param {string} className 样式名，可以是多个，中间使用空白符分隔
     */
    DOM.addClass = function (el, className) {
        // 这里直接添加是为了提高效率，因此对于可能重复添加的属性，请使用标志位判断是否已经存在，
        // 或者先使用 removeClass 方法删除之前的样式
        el.className += ' ' + className;
    };

    /**
     * 删除 Element 对象中的样式。
     * 
     * @public
     * @param {HTMLElement} el Element 对象
     * @param {string} className 样式名，可以是多个，中间用空白符分隔
     */
    DOM.removeClass = function (el, className) {
        var oldClasses = el.className.split(/\s+/).sort();
        var newClasses = className.split(/\s+/).sort();
        var i = oldClasses.length;
        var j = newClasses.length;

        for (; i && j; ) {
            if (oldClasses[i - 1] == newClasses[j - 1]) {
                oldClasses.splice(--i, 1);
            }
            else if (oldClasses[i - 1] < newClasses[j - 1]) {
                j--;
            }
            else {
                i--;
            }
        }
        el.className = oldClasses.join(' ');
    };    

})();

//==============================================================
// object
//==============================================================

/**
 * xutil.object
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    对象相关工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  none
 */

(function () {
    
    var OBJECT = xutil.object;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var arraySlice = Array.prototype.slice;
    
    /**
     * 属性拷贝（对象浅拷贝）
     * target中与source中相同的属性会被覆盖。
     * prototype属性不会被拷贝。
     * 
     * @public
     * @usage extend(target, source1, source2, source3);
     * @param {(Object|Array)} target
     * @param {(Object|Array)...} source 可传多个对象，
     *          从第一个source开始往后逐次extend到target中
     * @return {(Object|Array)} 目标对象
     */
    OBJECT.extend = function (target) {
        var sourceList = arraySlice.call(arguments, 1);
        for (var i = 0, source, key; i < sourceList.length; i ++) {
            if (source = sourceList[i]) {
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };

    /**
     * 类继承
     *
     * @public
     * @param {Function} subClass 子类构造函数
     * @param {Function} superClass 父类
     * @return {Object} 生成的新构造函数的原型
     */
    OBJECT.inherits = function (subClass, superClass) {
        var oldPrototype = subClass.prototype;
        var clazz = new Function();

        clazz.prototype = superClass.prototype;
        OBJECT.extend(subClass.prototype = new clazz(), oldPrototype);
        subClass.prototype.constructor = subClass;
        subClass.superClass = superClass.prototype;

        return subClass.prototype;
    };

    /**
     * 模型继承
     * 生成的构造函数含有父类的构造函数的自动调用
     *
     * @public
     * @param {Function} superClass 父类，如果无父类则为null
     * @param {Function} subClassConstructor 子类的标准构造函数，
     *          如果忽略将直接调用父控件类的构造函数
     * @return {Function} 新类的构造函数
     */
    OBJECT.inheritsObject = function (superClass, subClassConstructor) {
        var agent = function (options) {
                return new agent.client(options);
            }; 
        var client = agent.client = function (options) {
                options = options || {};
                superClass && superClass.client.call(this, options);
                subClassConstructor && subClassConstructor.call(this, options);
            };
            
        superClass && OBJECT.inherits(agent, superClass);
        OBJECT.inherits(client, agent);
        client.agent = agent;

        return agent;
    };

})();

//==============================================================
// number
//==============================================================

/**
 * xutil.number
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    数值相关工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  none
 */

(function () {
    
    var NUMBER = xutil.number;
            
    /**
     * 数值前部补0
     * 
     * @public
     * @param {(number|string)} source 输入数值, 可以整数或小数
     * @param {number} length 输出数值长度
     * @return {string} 输出数值
     */
    NUMBER.pad = function (source, length) {
        var pre = "";
        var negative = (source < 0);
        var string = String(Math.abs(source));
    
        if (string.length < length) {
            pre = (new Array(length - string.length + 1)).join('0');
        }
    
        return (negative ?  "-" : "") + pre + string;
    };
    
    /**
     * 将数值按照指定格式进行格式化
     * 支持：
     *      三位一撇，如：'23,444,12.98'
     *      前后缀，如：'23,444$', '23,444%', '#23,444'
     *      四舍五入
     *      四舍六入中凑偶（IEEE 754标准，欧洲金融常用）
     *      正数加上正号，如：'+23.45%'
     *      
     * @public
     * @example formatNumber(10000/3, "I,III.DD%"); 返回"3,333.33%"
     * @param {number} num 要格式化的数字
     * @param {string} formatStr 指定的格式
     *              I代表整数部分,可以通过逗号的位置来设定逗号分隔的位数 
     *              D代表小数部分，可以通过D的重复次数指定小数部分的显示位数
     * @param {string} usePositiveSign 是否正数加上正号
     * @param {number} cutMode 舍入方式：
     *                      0或默认:四舍五入；
     *                      2:IEEE 754标准的五舍六入中凑偶；
     *                      other：只是纯截取
     * @param {boolean} percentMultiply 百分数（formatStr满足/[ID]%/）是否要乘以100
     *                      默认为false
     * @return {string} 格式化过的字符串
     */
    NUMBER.formatNumber = function (
        num, formatStr, usePositiveSign, cutMode, percentMultiply
    ) {
        if (!formatStr) {
            return num;
        }

        if (percentMultiply && /[ID]%/.test(formatStr)) {
            num = num * 100;
        }

        num = NUMBER.fixNumber(num, formatStr, cutMode); 
        var str;
        var numStr = num.toString();
        var tempAry = numStr.split('.');
        var intStr = tempAry[0];
        var decStr = (tempAry.length > 1) ? tempAry[1] : "";
            
        str = formatStr.replace(/I+,*I*/g, function () {
            var matchStr = arguments[0];
            var commaIndex = matchStr.lastIndexOf(",");
            var replaceStr;
            var splitPos;
            var parts = [];
                
            if (commaIndex >= 0 && commaIndex != intStr.length - 1) {
                splitPos = matchStr.length - 1 - commaIndex; 
                while (intStr.length > splitPos) {
                    parts.push(intStr.substr(intStr.length-splitPos,splitPos));
                    intStr = intStr.substring(0, intStr.length - splitPos);
                }
                parts.push(intStr);
                parts.reverse();
                if (parts[0] == "-") {
                    parts.shift();
                    replaceStr = "-" + parts.join(",");
                } 
                else {
                    replaceStr = parts.join(",");
                }
            } 
            else {
                replaceStr = intStr;
            }
            
            if (usePositiveSign && replaceStr && replaceStr.indexOf('-') < 0) {
                replaceStr = '+' + replaceStr;
            }
            
            return replaceStr;
        });
        
        str = str.replace(/D+/g, function () {
            var matchStr = arguments[0]; 
            var replaceStr = decStr;
            
            if (replaceStr.length > matchStr.length) {
                replaceStr = replaceStr.substr(0, matchStr.length);
            } 
            else {
                while (replaceStr.length < matchStr.length) {
                    replaceStr += "0";
                }
            }
            return replaceStr;
        });
        // if ( !/[1-9]+/.test(str) ) { // 全零去除加减号，都不是效率高的写法
            // str.replace(/^(\+|\-)./, '');
        // } 
        return str;
    };
    
    /**
     * 不同方式的舍入
     * 支持：
     *      四舍五入
     *      四舍六入中凑偶（IEEE 754标准，欧洲金融常用）
     * 
     * @public
     * @param {number} cutMode 舍入方式
     *                      0或默认:四舍五入；
     *                      2:IEEE 754标准的五舍六入中凑偶
     */
    NUMBER.fixNumber = function (num, formatStr, cutMode) {
        var formatDec = /D+/.exec(formatStr);
        var formatDecLen = (formatDec && formatDec.length>0) 
                ? formatDec[0].length : 0;
        var p;
            
        if (!cutMode) { // 四舍五入
            p = Math.pow(10, formatDecLen);
            return ( Math.round (num * p ) ) / p ;
        } 
        else if (cutMode == 2) { // 五舍六入中凑偶
            return Number(num).toFixed(formatDecLen);
        } 
        else { // 原样
            return Number(num);
        }
    };

})();

//==============================================================
// fn
//==============================================================

/**
 * xutil.fn
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    函数相关工具函数
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  xutil.lang
 */

(function () {
    
    var FN = xutil.fn;
    var LANG = xutil.lang;
    var slice = Array.prototype.slice;
    var nativeBind = Function.prototype.bind;
    
    /**
     * 为一个函数绑定一个作用域
     * 如果可用，使用**ECMAScript 5**的 native `Function.bind`
     * 
     * @public
     * @param {Function|string} func 要绑定的函数，缺省则为函数本身
     * @param {Object} context 作用域
     * @param {Any...} 绑定附加的执行参数，可缺省
     * @rerturn {Funtion} 绑定完得到的函数
     */
    FN.bind = function (func, context) {
        var args;
        if (nativeBind && func.bind === nativeBind) {
            return nativeBind.apply(func, slice.call(arguments, 1));
        }
        func = LANG.isString(func) ? context[func] : func;
        args = slice.call(arguments, 2);
        return function () {
            return func.apply(
                context || func, args.concat(slice.call(arguments))
            );
        };
    };

})();

//==============================================================
// date
//==============================================================

/**
 * xutil.date
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:   时间相关工具函数集合。
 *          便于工程中统一时间格式，并提供时间相关的数学操作。
 * @author: sushuang(sushuang0322@gmail.com)
 * @depend: xutil.lang, xutil.number
 */

(function () {
    
    var DATE = xutil.date;
    var LANG = xutil.lang;
    var NUMBER = xutil.number;
        
    var DAY_MILLISECOND = 24*60*60*1000;
    
    /**
     * 默认通用的日期字符串格式为：
     * 'yyyy-MM-dd hh:mm'或'yyyy-MM-dd'或'yyyy-MM'或'yyyy'，
     * 如果要修改默认日期格式，修改如下诸属性。
     *
     * @type {string}
     * @public
     */
    DATE.DATE_FORMAT = 'yyyy-MM-dd';
    DATE.MINUTE_FORMAT = 'yyyy-MM-dd hh:mm';
    
    /**
     * 日期对象转换成字符串的简写
     * 
     * @public
     * @param {Date} currDate 日期对象
     * @param {string} format 格式，缺省为yyyy-MM-dd
     * @return {string} 日期字符串
     */
    DATE.dateToString = function (date, format) {
        if (!date) { return ''; }
        format = format || DATE.DATE_FORMAT;
        return DATE.format(date, format);
    };
    
    /**
     * 字符串转换成日期对象的简写
     * 
     * @public
     * @param {string} dateStr 字符串格式的日期，yyyy-MM-dd 或  yyyy-MM 或 yyyy
     * @return {Date} 日期对象，如果输入为空则返回null
     */
    DATE.stringToDate = function (dateStr) {
        if (dateStr) {
            return DATE.parse(dateStr);
        }
        return null;
    };
    
    /**
     * 得到周末
     * 
     * @public
     * @param {Date} date 目标日期对象
     * @param {boolean=} mode 
     *      true:得到星期六作为周末   false:得到星期日作为周末（默认）
     * @param {boolean=} remain 为false则新建日期对象（默认）；
     *                         为true则在输入的日期对象中改；
     *                         缺省为false
     */
    DATE.getWeekend = function (date, mode, remain) {
        var weekend = remain ? date : new Date(date);
        var offset = mode 
                ? (6 - weekend.getDay()) 
                : (7 - weekend.getDay()) % 7;
        weekend.setDate(weekend.getDate() + offset);
        return weekend;
    }
    
    /**
     * 得到周开始日期
     * 
     * @public
     * @param {Date} date 目标日期对象
     * @param {boolean=} mode 
     *      true:得到星期日作为周开始   false:得到星期一作为周开始（默认）
     * @param {boolean=} remain 为false则新建日期对象（默认）；
     *                         为true则在输入的日期对象中改；
     *                         缺省为false
     */
    DATE.getWorkday = function (date, mode, remain) {
        var workday = remain ? date : new Date(date);
        var d = workday.getDate();
        d = mode 
                ? (d - workday.getDay()) 
                : (d - (6 + workday.getDay()) % 7);
        workday.setDate(d);
        return workday;
    }
    
    /**
     * 获得某日期属于哪个季度，1~4
     * 
     * @public
     * @param {(string|Date)} date 目标日期
     * @return {number} 季度号，1~4
     */
    DATE.getQuarter = function (date) {
        if (!date) { return null; }
        LANG.isString(date) && (date = DATE.stringToDate(date)); 
        return Math.floor(date.getMonth() / 3) + 1 ;
    };
    
    /**
     * 获得该季度的第一天
     * 
     * @public
     * @param {(string|Date)} date 目标日期
     * @return {Date} 该季度的第一天
     */
    DATE.getQuarterBegin = function (date) {
        if (!date) { return null; }
        LANG.isString(date) && (date = DATE.stringToDate(date)); 
        var quarter = DATE.getQuarter(date);
        var mon = [0, 0, 3, 6, 9];
        return new Date(date.getFullYear(), mon[quarter], 1);
    };

    /**
     * 对目标日期对象进行格式化 (@see tangram)
     * 格式表达式，变量含义：
     * hh: 带 0 补齐的两位 12 进制时表示
     * h: 不带 0 补齐的 12 进制时表示
     * HH: 带 0 补齐的两位 24 进制时表示
     * H: 不带 0 补齐的 24 进制时表示
     * mm: 带 0 补齐两位分表示
     * m: 不带 0 补齐分表示
     * ss: 带 0 补齐两位秒表示
     * s: 不带 0 补齐秒表示
     * yyyy: 带 0 补齐的四位年表示
     * yy: 带 0 补齐的两位年表示
     * MM: 带 0 补齐的两位月表示
     * M: 不带 0 补齐的月表示
     * dd: 带 0 补齐的两位日表示
     * d: 不带 0 补齐的日表示
     * 
     * @public
     * @param {Date} source 目标日期对象
     * @param {string} pattern 日期格式化规则
     * @return {string} 格式化后的字符串
     */
    DATE.format = function (source, pattern) {
        var pad = NUMBER.pad;
        if (!LANG.isString(pattern)) {
            return source.toString();
        }
    
        function replacer(patternPart, result) {
            pattern = pattern.replace(patternPart, result);
        }
        
        var year    = source.getFullYear();
        var month   = source.getMonth() + 1;
        var date2   = source.getDate();
        var hours   = source.getHours();
        var minutes = source.getMinutes();
        var seconds = source.getSeconds();
    
        replacer(/yyyy/g, pad(year, 4));
        replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
        replacer(/MM/g, pad(month, 2));
        replacer(/M/g, month);
        replacer(/dd/g, pad(date2, 2));
        replacer(/d/g, date2);
    
        replacer(/HH/g, pad(hours, 2));
        replacer(/H/g, hours);
        replacer(/hh/g, pad(hours % 12, 2));
        replacer(/h/g, hours % 12);
        replacer(/mm/g, pad(minutes, 2));
        replacer(/m/g, minutes);
        replacer(/ss/g, pad(seconds, 2));
        replacer(/s/g, seconds);
    
        return pattern;
    };
    
    
    /**
     * 将目标字符串转换成日期对象 (@see tangram)
     * 对于目标字符串，下面这些规则决定了 parse 方法能够成功地解析：
     * 短日期可以使用“/”或“-”作为日期分隔符，但是必须用月/日/年的格式来表示，例如"7/20/96"。
     * 以 "July 10 1995" 形式表示的长日期中的年、月、日可以按任何顺序排列，年份值可以用 2 位数字表示也可以用 4 位数字表示。如果使用 2 位数字来表示年份，那么该年份必须大于或等于 70。
     * 括号中的任何文本都被视为注释。这些括号可以嵌套使用。
     * 逗号和空格被视为分隔符。允许使用多个分隔符。
     * 月和日的名称必须具有两个或两个以上的字符。如果两个字符所组成的名称不是独一无二的，那么该名称就被解析成最后一个符合条件的月或日。例如，"Ju" 被解释为七月而不是六月。
     * 在所提供的日期中，如果所指定的星期几的值与按照该日期中剩余部分所确定的星期几的值不符合，那么该指定值就会被忽略。例如，尽管 1996 年 11 月 9 日实际上是星期五，"Tuesday November 9 1996" 也还是可以被接受并进行解析的。但是结果 date 对象中包含的是 "Friday November 9 1996"。
     * JScript 处理所有的标准时区，以及全球标准时间 (UTC) 和格林威治标准时间 (GMT)。 
     * 小时、分钟、和秒钟之间用冒号分隔，尽管不是这三项都需要指明。"10:"、"10:11"、和 "10:11:12" 都是有效的。
     * 如果使用 24 小时计时的时钟，那么为中午 12 点之后的时间指定 "PM" 是错误的。例如 "23:15 PM" 就是错误的。 
     * 包含无效日期的字符串是错误的。例如，一个包含有两个年份或两个月份的字符串就是错误的。
     *             
     * @public
     * @param {string} source 目标字符串
     * @return {Date} 转换后的日期对象
     */
    DATE.parse = function (source) {
        var reg = new RegExp("^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+\x24");
        if ('string' == typeof source) {
            if (reg.test(source) || isNaN(Date.parse(source))) {
                var d = source.split(/ |T/);
                var d1 = d.length > 1 
                        ? d[1].split(/[^\d]/)
                        : [0, 0, 0];
                var d0 = d[0].split(/[^\d]/);
                
                return new Date(
                    d0[0],
                    (d0[1] != null ? (d0[1] - 1) : 0 ), 
                    (d0[2] != null ? d0[2] : 1), 
                    (d1[0] != null ? d1[0] : 0), 
                    (d1[1] != null ? d1[1] : 0), 
                    (d1[2] != null ? d1[2] : 0)
                );
            } 
            else {
                return new Date(source);
            }
        }
        
        return new Date();
    };    
    
})();
