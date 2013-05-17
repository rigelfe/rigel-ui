(function () {
    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        ext = core.ext,
        util = core.util,

        $create = core.$create,
        $fastCreate = core.$fastCreate,
        getPosition = dom.getPosition,
        children = dom.children,
        createDom = dom.create,
        moveElements = dom.moveElements,
        trim = string.trim,
        encodeHTML = string.encodeHTML,
        decodeHTML = string.decodeHTML,
        getView = util.getView,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
    
        EXT_UI_EDITOR = ui.Editor = 
        inheritsControl(
            UI_CONTROL,
            'ui-editor',
            null,
            function (el, options) {
                var editor = EXT_EDITOR_ITEMS[options.type];

                el.innerHTML = editor.innerHTML + 
                    '<div class="ui-button ui-button-g">确定</div><div class="ui-button">取消</div><div style="display:none" class="ui-editor-tip"></div>'
                for (var key in editor) {
                    if ('[object Function]' == Object.prototype.toString.call(editor[key])) {
                        if (key == 'process') {
                            editor[key].call(this);
                        }
                        else {
                            this[key] = editor[key];
                        }
                    }
                }
                el = el.lastChild;
                this._eTip = el;
                this._uCancelBtn = $fastCreate(this.Button, el = el.previousSibling, this, {command: 'cancel'});
                this._uSubmitBtn = $fastCreate(this.Button, el.previousSibling, this, {command: 'submit', primary:'ui-button-g'});
            }
        ),

        EXT_UI_EDITOR_CLASS = EXT_UI_EDITOR.prototype,

        EXT_UI_EDITOR_BUTTON_CLASS = (EXT_UI_EDITOR_CLASS.Button 
                = inheritsControl(UI_BUTTON, null, function (el, options){ this._sCommand = options.command; })).prototype,

        EXT_EDITOR_ITEMS = {},

        EXT_EDITORS = {};


    EXT_UI_EDITOR_CLASS.init = function () {
        this.$hide();
    }

    EXT_UI_EDITOR_CLASS.show = function (con) {
        var pos = getPosition(con),
            view = getView(),
            left = pos.left, top = pos.top;

        // if (options.target.onbeforeedit && !options.target.onbeforeedit(con, options)) {
        //     return;
        // }

        // this._oControl = con;
        // this._oOptions = options;

        // //动态设置值
        // if (this.setDatasource && options.target.ongetdatasource4editor) {
        //     this.setDatasource(options.target.ongetdatasource4editor.call(options.target, options));
        // }

        // this.setValue(value);
        // UI_CONTROL_CLASS.show.call(this);
        // this.resize();
        if (left + this.getWidth() > view.right) {
            left = view.right - this.getWidth();
        }
        if (top + this.getHeight() > view.bottom) {
            top = view.bottom - this.getHeight();
        }
        this.setPosition(left, top);
        this.focus();
    }

    EXT_UI_EDITOR_CLASS.$blur = function () {
        this.hide();
    } 

    EXT_UI_EDITOR_CLASS.onhide = function () {
        this.setError('');
    }

    EXT_UI_EDITOR_CLASS.setError = function (str) {
        str = trim(str);
        this._eTip.innerHTML = str;
        if (str == '') {
            this._eTip.style.display = 'none';
        }
        else {
            this._eTip.style.display = '';
        }
        this.resize();
    }

    EXT_UI_EDITOR_CLASS.$resize = function () {
         var el = this._eMain,
            currStyle = el.style;

        currStyle.width = this._sWidth;
        currStyle.height = this._sHeight;
        this.repaint();
    }

    EXT_UI_EDITOR_BUTTON_CLASS.$click = function () {
        var editor = this.getParent(); //editor
        var value = editor.getValue();
        var options = editor._oOptions;
        var table = editor.getParent();
        var editCell = table.editCell;
        var field = table.editField;
        var e = {};
        var o;
        var txt = editor.getText ? editor.getText() : editor.getValue();

        txt = encodeHTML(txt);

        if (this._sCommand == 'cancel') {
            editor.hide();
        }
        else {
            o = triggerEvent(table, 'editsubmit', e, [value, field]);
            if (o !== false) {
                if ('[object String]' == Object.prototype.toString.call(e.message) && e.message != '') {
                    editor.setError(e.message);
                }
                else {
                    e.value = (e.value !== undefined ? e.value : value);
                    editCell.innerHTML = e.value;
                    editor.setError('');
                    editor.hide();
                }
            }
        }
    }

    function EXT_EDITOR_GET(type) {
        var o;

        if (!EXT_EDITORS[type]) {
            o = document.body.appendChild(createDom(EXT_UI_EDITOR.TYPES));
            o = $create(EXT_UI_EDITOR, {main: o, type: type});
            o.cache();
            o.init();
            EXT_EDITORS[type] = o;
        }

        return EXT_EDITORS[type];
    }

    function ATTACH_CLICK_HANDLER(con, type, options) {
       return function () {
           if (type != 'custom') {
                EXT_EDITOR.edit(con, type, options)
            }
            else {
                (new Function('return ' + options.handle)).call(null).call(null, con, options);
            }
       }
    }

    EXT_EDITOR = ext.editor = function () {};    

    EXT_EDITOR.register = function (type, obj) {
        EXT_EDITOR_ITEMS[type] = obj;
    };

    EXT_EDITOR.init = function (con, type, options) {
        var o = createDom(),
            cssType = con.getTypes()[0],
            el = con.getBody();

        moveElements(el, o, true);
        el.innerHTML = '<div class="'+ cssType +'-editor"><div></div><div class="'+ cssType +'-editor-button"></div></div>';
        el.firstChild.lastChild.onclick = ATTACH_CLICK_HANDLER(con, type, options);
        moveElements(o, el.firstChild.firstChild, true);
        con.$setBody(el.firstChild.firstChild);
        o = null;
    };

    EXT_EDITOR.edit = function (con, type, options) {
        var value, editor;

        if (options.getValue) {
            if ('[object Function]' == Object.prototype.toString.call(options.getValue)) {
                value = options.getValue.call(null, con, options);
            }
            else {
                value = options.getValue;
            }
        }
        else {
            value = decodeHTML(trim(con.getContent()));
        }

        editor = EXT_EDITOR_GET(type);
        editor.show(con, value, options);
        setFocused(editor);
    };

    /*注册编辑器*/
    EXT_EDITOR.register('input', {

        innerHTML : '<input type="text" class="ui-editor-input" />',

        process : function () {
            this._eInput = this.getBody().firstChild;
        },

        focus : function () {
            this._eInput.focus();
        },

        getValue : function () {
            return trim(this._eInput.value);
        },

        setValue : function (value) {
            this._eInput.value = value;
        }
    });

    EXT_EDITOR.register('customSelect', {

        innerHTML : '<select class="ui-editor-select"></select>',

        process : function () {
            this._eSelect = this.getBody().firstChild;
        },

        focus : function () {
            this._eSelect.focus();
        },

        getValue : function () {
            return this._eSelect.options[this._eSelect.selectedIndex].value;
        },

        getText : function () {
            return this._eSelect.options[this._eSelect.selectedIndex].text;
        },

        setValue : function (value) {
            for (var i = 0, item; item = this._eSelect.options[i]; i++) {
                if (item.value == value || item.text == value) {
                    item.selected = true;
                    break;
                }
            }
        },

        setDatasource : function (datasource) {
            var sel = this._eSelect, i, item, o;

            while(sel.options[0]) {
                sel.remove(0);
            }

            for (i = 0; item = datasource[i]; i++) {
                o = createDom('', '', 'option');
                o.text = item.text;
                o.value = item.value;
                try {
                    sel.add(o, null);
                }
                catch(e) {
                    sel.add(o);
                }
            }
        }
    });
})();

/**
 * select 扩展
 */
(function () {
    var core = ecui,
        ui = core.ui,

        UI_SELECT_CLASS = ui.Select.prototype;

    UI_SELECT_CLASS.clear = function () {
        var items = this.getItems() || [],
            len = items.length;

        while ( len-- > 0 ) {
            this.remove(0);
        }

        this._uOptions.reset();
    };
})();

﻿/*
Select - 定义模拟下拉框行为的基本操作。
下拉框控件，继承自输入控件，实现了选项组接口，扩展了原生 SelectElement 的功能，允许指定下拉选项框的最大选项数量，在屏幕显示不下的时候，会自动显示在下拉框的上方。在没有选项时，下拉选项框有一个选项的高度。下拉框控件允许使用键盘与滚轮操作，在下拉选项框打开时，可以通过回车键或鼠标点击选择，上下键选择选项的当前条目，在关闭下拉选项框后，只要拥有焦点，就可以通过滚轮上下选择选项。

下拉框控件直接HTML初始化的例子:
<select ecui="type:select" name="sex">
  <option value="male" selected="selected">男</option>
  <option value="female">女</option>
</select>
或
<div ecui="type:select;name:sex;value:male">
  <div ecui="value:male">男</div>
  <div ecui="value:female">女</div>
</div>

属性
_nOptionSize  - 下接选择框可以用于选择的条目数量
_cSelected    - 当前选中的选项
_uText        - 下拉框的文本框
_uButton      - 下拉框的按钮
_uOptions     - 下拉选择框
*/
//{if 0}//
(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        string = core.string,
        ui = core.ui,
        util = core.util,

        undefined,
        DOCUMENT = document,
        MATH = Math,
        MAX = MATH.max,
        MIN = MATH.min,

        indexOf = array.indexOf,
        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        getPosition = dom.getPosition,
        getText = dom.getText,
        insertAfter = dom.insertAfter,
        insertBefore = dom.insertBefore,
        moveElements = dom.moveElements,
        removeDom = dom.remove,
        encodeHTML = string.encodeHTML,
        extend = util.extend,
        getView = util.getView,
        setDefault = util.setDefault,

        $fastCreate = core.$fastCreate,
        getAttributeName = core.getAttributeName,
        getFocused = core.getFocused,
        inheritsControl = core.inherits,
        intercept = core.intercept,
        mask = core.mask,
        restore = core.restore,
        setFocused = core.setFocused,
        triggerEvent = core.triggerEvent,

        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_SCROLLBAR = ui.Scrollbar,
        UI_PANEL = ui.Panel,
        UI_PANEL_CLASS = UI_PANEL.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype,
        UI_ITEMS = ui.Items,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype;
//{/if}//
//{if $phase == "define"}//
    ///__gzip_original__UI_SELECT
    ///__gzip_original__UI_SELECT_CLASS
    /**
     * 初始化下拉框控件。
     * options 对象支持的属性如下：
     * browser        是否使用浏览器原生的滚动条，默认使用模拟的滚动条
     * optionSize     下拉框最大允许显示的选项数量，默认为5
     * optionsElement 下拉选项主元素
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_SELECT_ASYNC = ui.SelectAsync =
        inheritsControl(
            UI_SELECT,
            'ui-select-async',
            null,
            null
        );
        UI_SELECT_ASYNC_CLASS = UI_SELECT_ASYNC.prototype;
        UI_SELECT_ASYNC_CLASS.$activate = function(event) {

        }
//{if 0}//
})();
//{/if}//

/**
 * cascade-select.js
 * Copyright 2012 Baidu Inc. All rights reserved
 *
 * desc: 级联下拉菜单
 * author: hades(denghongqi@baidu.com)
 */

 (function () {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        string = core.string,
        util = core.util,

        $fastcreate = core.$fastcreate,
        $connect = core.$connect,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        encodeHTML = string.encodeHTML,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype,

        UI_CASCADE_SELECT = ui.CascadeSelect = inheritsControl(
            UI_SELECT,
            null,
            function (el, options) {},
            function (el, options) {
                this._bTarget = options.target;
                $connect(this, function (target) {
                    this._cTarget = target;
                }, this._bTarget);
            }
        ),
        UI_CASCADE_SELECT_CLASS = UI_CASCADE_SELECT.prototype;

    UI_CASCADE_SELECT_CLASS.$change = function () {
        UI_SELECT_CLASS.$click.call(this);
        var target = this._cTarget;
        var nowValue = this.getValue();
        triggerEvent(target, 'loaddata', function (options, value) {
            var control = target;
            control.clear();
            for (var i = 0, o; o = options[i]; i++) {
                control.add(o.text, null, {value : o.value});
            } 
            if(value) {
                control.setValue(value);
            }
            else {
                control.setSelectedIndex(0);
            }
        }, [nowValue]);
    };

 }) ();
/*
Pager - 分页控件。
分页控件，配合表格控件使用，翻页时触发change事件，可在其中进行表格数据的更新。

分页控件直接HTML初始化的例子:
<div type="type:pager;pageSize:10;maxNum:40" class="ui-pager"></div>

属性
nPage:      当前的页码(从1开始记数)
nPageSize:  每页的记录数
nTotal:     总记录数

事件
change:     切换了分页

*/
//{if 0}//
(function () {

    var core = ecui,
        dom = core.dom,
        string = core.string,
        array = core.array,
        ui = core.ui,
        util = core.util,

        undefined,
        MATH = Math,

        createDom = dom.create,
        children = dom.children,
        extend = util.extend,
        blank = util.blank,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_BUTTON = ui.Button,
        UI_SELECT = ui.Select,
        UI_ITEM = ui.Item,
        UI_ITEMS = ui.Items,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_ITEM_CLASS = UI_ITEM.prototype,
        UI_SELECT_CLASS = UI_SELECT.prototype;
//{/if}//
//{if $phase == "define"}//
    ///__gzip_original__UI_INPUT_CONTROL
    ///__gzip_original__UI_INPUT_CONTROL_CLASS
    /**
     * 初始化分页控件。
     * options 对象支持的属性如下：
     *      {Number} pageSize   每页的最大记录数
     *      {Number} total      记录总数 
     *      {Number} page      当前页码
     *
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_PAGER = ui.Pager =
        inheritsControl(
            UI_CONTROL,
            'ui-pager',
            function (el, options) {
                var type = this.getTypes()[0],
                    i, len, html = [];
                
                if (!options.showCount || options.showCount < 3) {
                    len = this._nShowCount = 7;
                }
                else {
                    len = this._nShowCount = options.showCount;
                }
                this._bOMSButton = options.omsButton !== false;
                html.push('<div class="' + type + '-button-prv ' + type + '-button">上一页</div><div class="'+ type +'-items">');
                for (i = 0; i < len; i++) {
                    if (i == 1 || i == len - 1) {
                        html.push('<div class="'+ type +'-item-oms" ecui="disabled:true">...</div>');
                    }
                    html.push('<div class="'+ type +'-item"></div>');
                }
                html.push('</div><div class="' + type + '-button-nxt ' + type + '-button">下一页</div>');

                el.innerHTML = html.join('');

            },
            function (el, options) {
                el = children(el);

                this._bResizable = false;
                this._nPage = options.page || 1;
                this._nPageSize = options.pageSize || 50;
                this._nTotal = options.total || 0;

                this._uPrvBtn = $fastCreate(this.Button, el[0], this);
                this.$setBody(el[1]);
                this._uNxtBtn = $fastCreate(this.Button, el[2], this);
                this.$initItems();
            }
        ),
        UI_PAGER_CLASS = UI_PAGER.prototype,
        UI_PAGER_BUTTON = UI_PAGER_CLASS.Button = 
        inheritsControl(
            UI_BUTTON, 
            'ui-pager-button', 
            function (el, options) {
                var type = this.getTypes()[0],
                    o = createDom(type + '-icon');

                el.insertBefore(o, el.firstChild);
            }
        ),
        UI_PAGER_BUTTON_CLASS = UI_PAGER_BUTTON.prototype,
        UI_PAGER_ITEM_CLASS = (UI_PAGER_CLASS.Item = inheritsControl(UI_ITEM, 'ui-pager-item', function (el, options) {
            options.resizeable = false; 
        })).prototype;
//{else}//

    extend(UI_PAGER_CLASS, UI_ITEMS);
    
    /**
     * 分页按钮事件处理函数
     * 根据按钮的step属性确定需要切换的页码
     * @private
     */
    function UI_PAGER_BTN_CLICK(event){
        var par = this.getParent(),
            curIndex = par._nPage,
            maxNum = par.getMaxPage(),
            n = this.getStep();

        UI_CONTROL_CLASS.$click.call(this);

        if (n.charAt(0) == '+') {
            curIndex += parseInt(n.substring(1), 10);
            //+0 尾页
            if (curIndex == par._nPage) {
                curIndex = maxNum;
            }
            else if (curIndex > maxNum) {
                curIndex = par._nPage;
            }
        }
        else if (n.charAt(0) == '-') {
            curIndex -= parseInt(n.substring(1), 10);
            //-0 首页
            if (curIndex == par._nPage) {
                curIndex = 1;
            }
            else if (curIndex < 1) {
                curIndex = par._nPage;
            }
        }
        else {
            curIndex = parseInt(n, 10);
        }

        if (par._nPage != curIndex) {
            triggerEvent(par, 'change', null, [curIndex]);
        }
    }

    /**
     * 控件刷新
     * 根据当前的页码重置按钮
     * @private
     */
    function UI_PAGER_REFRESH(con) {
        var items = con._aPageBtn,
            max = con.getMaxPage(),
            idx = con._nPage,
            showCount = con._nShowCount,
            nHfNum = parseInt(showCount / 2, 10),
            start = idx - nHfNum > 0 ? idx - nHfNum : 1,
            end, i, item;

        if (idx == 1) {
            con._uPrvBtn.disable();
        }
        else {
            con._uPrvBtn.enable();
        }

        if (idx == max || max == 0) {
            con._uNxtBtn.disable();
        }
        else {
            con._uNxtBtn.enable();
        }

        if (start + showCount - 1 > max && max - showCount >= 0) {
            start = max - showCount + 1;
        }
        for (i = 0; item = items[i]; i++) {
            end = start + i;
            item.setContent(end);
            item.setStep(end);
            item.setSelected(idx == end);
            if (end > max) {
                item.hide();
            }
            else {
                item.show();
            }
        }

        UI_PAGER_OMS_REFRESH(con);
    }
   
    /**
     * 刷新more符号按钮
     * @private
     */
    function UI_PAGER_OMS_REFRESH(con) {
        var items = con._aPageBtn,
            omsBtn = con._aOMSBtn,
            max = con.getMaxPage(),
            item;

        if (!con._bOMSButton) {
            return;
        }
        
        if (items[0].getContent() != '1') {
            items[0].setContent(1);
            items[0].setStep(1);
            omsBtn[0].show();
        }
        else {
            omsBtn[0].hide();
        }

        item = items[items.length - 1];
        if (item.isShow() && item.getContent() != max) {
            item.setContent(max);
            item.setStep(max);
            omsBtn[1].show();
        }
        else {
            omsBtn[1].hide();
        }
    }

    UI_PAGER_ITEM_CLASS.$setSize = blank;

    /**
     * 设置页码按钮的选择状态
     * @public
     *
     * @param {Boolean} flag 是否选中
     */
    UI_PAGER_ITEM_CLASS.setSelected = function (flag) {
        this.alterClass((flag ? '+' : '-') + 'selected');
    };

    /**
     * 设置按钮的步进
     * +/-n 向前/后翻n页
     * +0 尾页 -0 首页
     * @public
     *
     * @param {String} n 步进
     */
    UI_PAGER_BUTTON_CLASS.setStep = UI_PAGER_ITEM_CLASS.setStep = function (n) {
        this._sStep = n + '';
    };

    /**
     * 获取步进
     * @public
     *
     * @return {String} 步进
     */
    UI_PAGER_BUTTON_CLASS.getStep = UI_PAGER_ITEM_CLASS.getStep = function () {
        return this._sStep;
    };

    /**
     * @override
     */
    UI_PAGER_BUTTON_CLASS.$click = UI_PAGER_ITEM_CLASS.$click = UI_PAGER_BTN_CLICK;

    /**
     * 得到最大的页数
     * @public
     *
     * @return {Number} 最大的页数
     */
    UI_PAGER_CLASS.getMaxPage = function () {
        return MATH.ceil(this._nTotal / this._nPageSize);
    };

    /**
     * 得到最大的记录数
     * @public
     *
     * @return {Number} 最大的记录数
     */
    UI_PAGER_CLASS.getTotal = function () {
        return this._nTotal;
    };

    /**
     * 得到最大的记录数
     * @public
     *
     * @return {Number} 最大的记录数
     */
    UI_PAGER_CLASS.getTotal = function () {
        return this._nTotal;
    };

    /**
     * 翻页
     * 不会对参数进行有效检查
     * @public
     *
     * @param {Number} i 目标页码
     */
    UI_PAGER_CLASS.go = function (i) {
        this._nPage = i;
        UI_PAGER_REFRESH(this); 
    };

    /**
     * 设置每页的记录数
     * @public
     *
     * @param {Number} num 记录数
     */
    UI_PAGER_CLASS.setPageSize = function (num) {
        this._nPageSize = num;
        this._nPage = 1;
        UI_PAGER_REFRESH(this); 
    };

    /**
     * 设置总记录数
     * @public
     *
     * @param {Number} num 记录数
     */
    UI_PAGER_CLASS.setTotal = function (num) {
        this._nTotal = num;
        this._nPage = 1;
        UI_PAGER_REFRESH(this); 
    };

    /**
     * 初始化函数
     * 初始化设置并根据初始参数设置控件各部件的状态
     *
     * @override
     */
    UI_PAGER_CLASS.init = function () {
        var i, item, items = this.getItems();

        this._uPrvBtn.setStep('-1');
        this._uNxtBtn.setStep('+1');
        this._aOMSBtn = [];
        this._aPageBtn = [];
        UI_CONTROL_CLASS.init.call(this);
        for (i = 0; item = items[i]; i++) {
            item.init();
            if (i == 1 || i == items.length - 2) {
                this._aOMSBtn.push(item);
                item.hide();
            }
            else {
                this._aPageBtn.push(item);
            }
        }
        UI_PAGER_REFRESH(this);
    };

    /**
     * override
     */
    UI_PAGER_CLASS.$setSize = blank;

//{/if}//
//{if 0}//
})();
//{/if}//

/**
 * @file 工作台首页订制的分页控件,只满足简单分页需求
 * @author hades(denghongqi@gmail.com)
 */

(function() {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        util = core.util,

        $fastcreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        createDom = dom.create,
        children = dom.children,
        setStyle = dom.setStyle,
        addClass = dom.addClass,
        removeClass = dom.removeClass,
        extend = util.extend,
        blank = util.blank,

        MATH = Math,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype,
        UI_ITEMS = ui.Items;

    var UI_CUSTOM_PAGER = ui.CustomPager =
        inheritsControl(
            UI_CONTROL,
            'ui-custom-pager',
            function(el, options) {
                var type = this.getTypes()[0];
                setStyle(el, 'display', 'inline-block');
                el.innerHTML = '<span class="' + type + '-pre" style="'
                    + 'display:inline-block">&lt;</span>'
                    + '<span class="' + type + '-items" style="'
                    + 'display:inline-block">'
                    + '<span ecui="value:1">1</span>'
                    + '<span ecui="value:2">2</span>'
                    + '<span ecui="value:3">3</span>'
                    + '</span>'
                    + '<span class="' + type + '-next" style="'
                    + 'display:inline-block">&gt;</span>';
            },
            function(el, options) {
                this._nPage = options.page - 0 || 1;
                this._nTotal = options.total - 0 || 100;
                this._nPagesize = options.pagesize - 0 || 10;
                this._nMaxShow = options.maxShow - 0 || 3;
                el = children(el);

                this._uPre = $fastcreate(
                    this.Pre, 
                    el[0], 
                    this, 
                    {userSelect:false}
                );
                this._uNext = $fastcreate(
                    this.Next, 
                    el[2], 
                    this, 
                    {userSelect:false}
                );
                this.$setBody(el[1]);
                this.$initItems();
                flushPager(this, this._nPage);
                //this.render();
            }
        );

    var UI_CUSTOM_PAGER_CLASS = UI_CUSTOM_PAGER.prototype;

    /**
     * @public
     */
    UI_CUSTOM_PAGER_CLASS.getValue = function() {
        if (this._cSelected) {
            return this._cSelected.$getValue();
        }
        else {
            return null;
        }
    };

    /**
     * 渲染分页控件
     * @public
     * @param {number} page 当前页
     * @param {number} total 总数
     * @param {number} pagesize 每页条数
     */
    UI_CUSTOM_PAGER_CLASS.render = function(page, total, pagesize) {
        this._nPage = page || 1;
        this._nTotal = total || 0;
        this._nPagesize = pagesize || 10;
        flushPager(this, this._nPage);
    }

    UI_CUSTOM_PAGER_CLASS.Pre = inheritsControl(UI_CONTROL);
    var UI_CUSTOM_PAGER_PRE_CLASS = UI_CUSTOM_PAGER_CLASS.Pre.prototype;

    UI_CUSTOM_PAGER_CLASS.Next = inheritsControl(UI_CONTROL);
    var UI_CUSTOM_PAGER_NEXT_CLASS = UI_CUSTOM_PAGER_CLASS.Next.prototype;

    /**
     * @event
     */
    UI_CUSTOM_PAGER_PRE_CLASS.$click = function() {
        var par = this.getParent();
        var value = par.getValue() - 1;
        flushPager(par, value);
    };

    /**
     * @event
     */
    UI_CUSTOM_PAGER_NEXT_CLASS.$click = function() {
        var par = this.getParent();
        var value = par.getValue() + 1;
        flushPager(par, value);
    };

    /**
     * 刷新分页页码items
     * @param {ecui.ui.CustomPager} control
     */
    function flushPager(control, value) {
        control._nTotalPage = MATH.ceil(control._nTotal / control._nPagesize);

        if (control._nTotalPage < control.getItems().length) {
            for (var i = 0; i < control._nMaxShow - control._nTotalPage; i++) {
                var items = control.getItems();
                control.remove(items[items.length - 1]);
            }
        }

        if (control._nTotalPage <= 1) {
            control.hide();
            return ;
        }

        var items = control.getItems();
        var start = items[0].$getValue();
        var end = items[items.length - 1].$getValue();

        if (value <= 1) {
            value = 1;
            control._uPre.disable();
        }
        else {
            control._uPre.enable();
        }

        if (value >= control._nTotalPage) {
            value = control._nTotalPage;
            control._uNext.disable();
        }
        else {
            control._uNext.enable();
        }

        if (value < start) {
            start = value;
            end = value + items.length;
        }
        else if (value > end) {
            end = value;
            start = end - items.length + 1;
        }

        for (var i = 0; i < items.length; i++) {
            var o = items[i];
            o.$setValue(i + start);
            if (value == o.$getValue()) {
                o.$setSelected();
            }
        }
    };

    UI_CUSTOM_PAGER_CLASS.Item = inheritsControl(
        UI_CONTROL,
        null,
        function(el, options) {
            options.userSelect = false;
        },
        function(el, options) {
            this._nValue = options.value;
        }
    );
    var UI_CUSTOM_PAGER_ITEM_CLASS = UI_CUSTOM_PAGER_CLASS.Item.prototype;
    extend(UI_CUSTOM_PAGER_CLASS, UI_ITEMS);

    UI_CUSTOM_PAGER_CLASS.$alterItems = blank;

    /**
     * @event
     */
    UI_CUSTOM_PAGER_ITEM_CLASS.$click = function() {
        var par = this.getParent();
        var value = this.$getValue();
        flushPager(par, value);
    };

    /**
     * 页码item被选中时触发
     * @private
     */
    UI_CUSTOM_PAGER_ITEM_CLASS.$setSelected = function() {
        var par = this.getParent();
        if (par._nValue == this.$getValue()) {
            return ;
        }
        else {
            if (par._cSelected) {
                removeClass(
                    par._cSelected.getOuter(), 
                    'ui-custom-pager-item-selected'
                );
            }
            addClass(this.getOuter(), 'ui-custom-pager-item-selected');
            par._cSelected = this;
            par._nValue = this.$getValue();
            triggerEvent(par, 'change', null, [par.getValue()]);
        }
    };

    /**
     * @private
     * @param {number} value
     */
    UI_CUSTOM_PAGER_ITEM_CLASS.$setValue = function(value) {
        this._nValue = value;
        this._sName = value;
        this.setContent(this._sName);
    };

    /**
     * @private
     */
    UI_CUSTOM_PAGER_ITEM_CLASS.$getValue = function() {
        return this._nValue;
    };
}) ();
/*
Pager - 分页控件。
分页控件，配合表格控件使用，翻页时触发change事件，可在其中进行表格数据的更新。

分页控件直接HTML初始化的例子:
<div type="type:pager;pageSize:10;maxNum:40" class="ui-pager"></div>

属性
nPage:      当前的页码(从1开始记数)
nPageSize:  每页的记录数
nTotal:     总记录数

事件
change:     切换了分页

*/
(function () {

    var core = ecui,
        dom = core.dom,
        string = core.string,
        array = core.array,
        ui = core.ui,
        util = core.util,

        undefined,
        MATH = Math,

        createDom = dom.create,
        children = dom.children,
        extend = util.extend,
        blank = util.blank,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_PAGER = ui.Pager,
        UI_SELECT = ui.Select,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_PAGER_CLASS = UI_PAGER.prototype;
    /**
     * 初始化分页控件。
     * options 对象支持的属性如下：
     *      {Number} pageSize   每页的最大记录数
     *      {Number} total      记录总数 
     *      {Number} page      当前页码
     *
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_EXT_PAGER = ui.ExtPager =
        inheritsControl(
            UI_CONTROL,
            'ui-ext-pager',
            function (el, options) {
                var type = this.getTypes()[0],
                    i, len, html = [];

                if (options.pageOptions) {
                    this.PAGE_SIZE = options.pageOptions.split(',');
                }
                else {
                    this.PAGE_SIZE = [10, 20, 50, 100];
                }
                
                html.push('<div class="' + type + '-page">共<em></em>页</div>');
                html.push('<span style="float:left; margin-right:10px">，</span>');
                html.push('<div class="'+ type +'-sum">共<em></em>条记录</div>');
                html.push('<div class="ui-pager"></div>');
                html.push('<div class="'+ type +'-pagesize">每页显示<select class="ui-select" style="width:45px">');
                for (i = 0, len = this.PAGE_SIZE.length; i < len; i++) {
                    html.push('<option value="'+ this.PAGE_SIZE[i] +'">' + this.PAGE_SIZE[i] + '</option>');
                }
                html.push('</select>条')
                el.innerHTML = html.join('');

                //处理pageSize
                options.pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
                for (i = 0, len = this.PAGE_SIZE.length; i < len; i++) {
                    if (this.PAGE_SIZE[i] == options.pageSize) {
                        break;
                    }
                }
                
            },
            function (el, options) {
                var el = children(el),
                    me = this;

                this._bResizable = false;
                this._eTotalPage = el[0].getElementsByTagName('em')[0];
                this._eTotalNum = el[2].getElementsByTagName('em')[0];
                this._uPager = $fastCreate(UI_PAGER, el[3], this, extend({}, options));
                this._uPager.$change = function (value) {
                    triggerEvent(me, 'change', null, [value, me._uPager._nPageSize]);
                }
                this._uSelect = $fastCreate(UI_SELECT, el[4].getElementsByTagName('select')[0], this);
                this._uSelect.$change = function () {
                    triggerEvent(me, 'pagesizechange', null, [this.getValue()]);
                }
            }
        ),

        UI_EXT_PAGER_CLASS = UI_EXT_PAGER.prototype,

        DEFAULT_PAGE_SIZE = 50;
        

    UI_EXT_PAGER.PAGE_SIZE = [10, 20, 50, 100];

    UI_EXT_PAGER_CLASS.init = function () {
        this._uPager.init();
        this._uSelect.init();
        this._eTotalPage.innerHTML = this._nTotalPage || 1;
        this._eTotalNum.innerHTML = this._uPager._nTotal || 0;
        this._uSelect.setValue(this._uPager._nPageSize);
    }

    UI_EXT_PAGER_CLASS.render = function (page, total, pageSize) {
        var item = this._uPager;

        this._uSelect.setValue(pageSize);
        if (total || total == 0) {
            this._eTotalNum.innerHTML = total;
            item._nTotal = total
        }
        else {
            this._eTotalPage.innerHTML = item._nPage || 0;
            this._eTotalNum.innerHTML = item._nTotal || 0;
            item._nTotal = item._nTotal || 0;
        }
        item._nPageSize = pageSize || item._nPageSize;

        //by hades
        this._nTotalPage = MATH.ceil(total / pageSize);
        this._eTotalPage.innerHTML = this._nTotalPage;

        item.go(page);
    };

    UI_EXT_PAGER_CLASS.getPageSize = function () {
        return this._uPager._nPageSize;
    };

    UI_EXT_PAGER_CLASS.getPage = function () {
        return this._uPager._nPage;
    };

    UI_EXT_PAGER_CLASS.getTotal = function () {
        return this._uPager._nTotal;
    };
    
    /**
     * override
     */
    UI_EXT_PAGER_CLASS.$setSize = blank;

})();

/*
MultiSelect - 定义多选下拉框行为的基本操作。
多选下拉框控件，继承自输入框控件，实现了选项组接口，参见下拉框控件。

下拉框控件直接HTML初始化的例子:
<select ecui="type:multi-select;option-size:3" name="test">
    <!-- 这里放选项内容 -->
    <option value="值">文本</option>
    ...
    <option value="值" selected>文本</option>
    ...
</select>

如果需要自定义特殊的选项效果，请按下列方法初始化:
<div ecui="type:multi-select;name:test;option-size:3">
    <!-- 这里放选项内容 -->
    <li ecui="value:值">文本</li>
    ...
</div>

Item属性
_eInput - 多选项的INPUT对象
*/
//{if 0}//
(function () {
    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        util = core.util,

        indexOf = array.indexOf,
        getText = dom.getText,
        removeDom = dom.remove,
        createDom = dom.create,
        setInput = dom.setInput,
        extend = util.extend,
        inherits = util.inherits,

        getKey = core.getKey,
        mask = core.mask,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_ITEMS = ui.Items,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype,
        UI_SELECT_ITEM = UI_SELECT_CLASS.Item,
        UI_SELECT_ITEM_CLASS = UI_SELECT_ITEM.prototype;
//{/if}//
//{if $phase == "define"}//
    /**
     * 初始化多选下拉框控件。
     * options 对象支持的属性如下：
     * optionSize 下拉框最大允许显示的选项数量，默认为5
     * @public
     *
     * @param {Object} options 初始化选项
     */
    //__gzip_original__UI_MULTI_SELECT
    //__gzip_original__UI_MULTI_SELECT_ITEM
    var UI_MULTI_SELECT = ui.MultiSelect = 
        inheritsControl(
            UI_SELECT,
            'ui-multi-select',
            function (el, options) {
                options.hide = true;
                if (options.value) {
                    options.value = options.value.toString();
                }
            },
            function(el, options) {
                var values;

                if (options.maxlength) {
                    this._nTextLen = options.maxlength;
                }
                if (options.textAll) {
                    this._sTextAll = options.textAll;
                }
                if (options.textNone) {
                    this._sTextNone = options.textNone;
                }
                if (options.maxSelected) {
                    this._nMaxSelected = options.maxSelected;
                }
                else if (options.selectAllButton) {
                    this.add('全部', 0, {selectAllButton: true});
                    this._bSelectAllBtn = true;
                }
                if (options.tip) {
                    this._bTip = true;
                }
                if (options.value) {
                    this.setValue(options.value);
                }
                if (options.selectAll) {
                    this._bInitSelectAll = true;
                }
                if (options.minSelected) {
                    this._nMinSelected = options.minSelected;
                }

                this._eInput.disabled = true;
            }
        ),
        UI_MULTI_SELECT_CLASS = UI_MULTI_SELECT.prototype,

        /**
         * 初始化多选下拉框控件的选项部件。
         * @public
         *
         * @param {Object} options 初始化选项
         */
        UI_MULTI_SELECT_ITEM = UI_MULTI_SELECT_CLASS.Item =
            inheritsControl(
            UI_SELECT_ITEM,
            'ui-multi-select-item',
            function (el, options) {
                var type = this.getTypes()[0],
                    o = createDom(type + '-icon');
                
                this._bSelectAllBtn = options.selectAllButton;
                this._sTip = options.tip ? options.tip : getText(el);

                el.insertBefore(o, el.firstChild);
                el = this._eInput =
                    options.parent.getMain().appendChild(setInput(null, options.parent.getName(), 'checkbox'));

                options.value === undefined ? el.value = '' : el.value = options.value;
                el.style.display = 'none';
            }
        ),
        UI_MULTI_SELECT_ITEM_CLASS = UI_MULTI_SELECT_ITEM.prototype;
//{else}//
    
    /**
     * 刷新全选按钮
     * @private
     */
    function UI_MULTI_SELECT_FLUSH_SELECTALL(control, status) {
        var items = control.getItems();

        if (!control._bSelectAllBtn) {
            return;
        }

        if (status === undefined) {
            status = control.getSelected().length === items.length - 1;
            items[0].$setSelected(status);
        }
        else {
            for (var i = 0, item; item = items[i]; i++) {
                item.$setSelected(status);
            }
        }
    }

    /**
     * 刷新显示区域的选中值列表。
     * @private
     *
     * @param {ecui.ui.MultiSelect} control 多选下拉框控件
     */
    function UI_MULTI_SELECT_FLUSH_TEXT(control) {
        var tip;
        if (control) {
            var btnAllSelected = false;
            for (var i = 0, list = control.getItems(), o, text = []; o = list[i++]; ) {
                if (o.isSelected()) {
                    if (o._bSelectAllBtn) {
                        btnAllSelected = true;
                    }
                    else {
                        text.push(o._sTip);
                    }
                }
            }
            tip = '<span title="'+ text.join(',') +'">';
            if (
                control._sTextAll
                && (text.length != 0 || btnAllSelected)
                && text.length == list.length + (control._bSelectAllBtn ? -1 : 0) 
            ) {
                text = control._sTextAll;
            }
            else if (text.length == 0 && control._sTextNone) {
                text = control._sTextNone;
            }
            else {
                text = text.join(',');
                if (control._nTextLen && text.length > control._nTextLen) {
                    text = text.substring(0, control._nTextLen) + '...';
                }
            }
            if (control._bTip) {
                text = tip + text + '</span>';
            }
            control.$getSection('Text').setContent(text);
        }
    }

    extend(UI_MULTI_SELECT_CLASS, UI_ITEMS);

    /**
     * 鼠标单击控件事件的默认处理。
     * 控件点击时将改变当前的选中状态。如果控件处于可操作状态(参见 isEnabled)，click 方法触发 onclick 事件，如果事件返回值不为 false，则调用 $click 方法。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_ITEM_CLASS.$click = function (event) {
        var par = this.getParent(),
            selected = par.getSelected().length;

        UI_SELECT_ITEM_CLASS.$click.call(this, event);
        if (!this.isSelected()) {
            if (!par._nMaxSelected || par._nMaxSelected >= selected + 1) {
                this.setSelected(true);
            }
        }
        else {
            if (!par._nMinSelected || par._nMinSelected <= selected - 1) {
                this.setSelected(false);
            }
        }
    };

    /**
     * 销毁控件的默认处理。
     * 页面卸载时将销毁所有的控件，释放循环引用，防止在 IE 下发生内存泄漏，$dispose 方法的调用不会受到 ondispose 事件返回值的影响。
     * @protected
     */
    UI_MULTI_SELECT_ITEM_CLASS.$dispose = function () {
        this._eInput = null;
        UI_SELECT_ITEM_CLASS.$dispose.call(this);
    };

    /**
     * 判断当前选项是否选中。
     * @protected
     *
     * @return {boolean} 当前项是否选中
     */
    UI_MULTI_SELECT_ITEM_CLASS.isSelected = function () {
        return this._eInput.checked;
    };

    /**
     *
     */
    UI_MULTI_SELECT_ITEM_CLASS.$setSelected = function (status) {
        this._eInput.checked = status !== false;
        this.setClass(this.getPrimary() + (this._eInput.checked ? '-selected' : ''));
    }

    /**
     * 设置当前选项是否选中。
     * @protected
     *
     * @param {boolean} status 当前项是否选中，默认选中
     */
    UI_MULTI_SELECT_ITEM_CLASS.setSelected = function (status) {
        this.$setSelected(status);
        UI_MULTI_SELECT_FLUSH_SELECTALL(this.getParent(), this._bSelectAllBtn ? status : undefined);
        UI_MULTI_SELECT_FLUSH_TEXT(this.getParent());
    };

    /**
     * 选项控件发生变化的处理。
     * 在 选项组接口 中，选项控件发生增加/减少操作时调用此方法。
     * @protected
     */
    UI_MULTI_SELECT_CLASS.$alterItems = function () {
        UI_SELECT_CLASS.$alterItems.call(this);
        UI_MULTI_SELECT_FLUSH_SELECTALL(this);
        UI_MULTI_SELECT_FLUSH_TEXT(this);
    };

    /**
     * 控件增加子控件事件的默认处理。
     * 选项组增加子选项时需要判断子控件的类型，并额外添加引用。
     * @protected
     *
     * @param {ecui.ui.Item} child 选项控件
     * @return {boolean} 是否允许增加子控件，默认允许
     */
    UI_MULTI_SELECT_CLASS.$append = function (item) {
        UI_SELECT_CLASS.$append.call(this, item);
        this.getMain().appendChild(setInput(item._eInput, this.getName()));
    };

    /**
     * 计算控件的缓存。
     * 控件缓存部分核心属性的值，提高控件属性的访问速度，在子控件或者应用程序开发过程中，如果需要避开控件提供的方法(setSize、alterClass 等)直接操作 Element 对象，操作完成后必须调用 clearCache 方法清除控件的属性缓存，否则将引发错误。
     * @protected
     *
     * @param {CssStyle} style 基本 Element 对象的 Css 样式对象
     * @param {boolean} cacheSize 是否需要缓存控件大小，如果控件是另一个控件的部件时，不缓存大小能加快渲染速度，默认缓存
     */
    UI_MULTI_SELECT_CLASS.$cache = UI_SELECT_CLASS.$cache;

    /**
     * 界面点击强制拦截事件的默认处理。
     * 控件在多选下拉框展开时，需要拦截浏览器的点击事件，如果点击在下拉选项区域，则选中当前项，否则直接隐藏下拉选项框，但不会改变控件激活状态。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_CLASS.$intercept = function (event) {
        for (var control = event.getControl(); control; control = control.getParent()) {
            if (control instanceof UI_MULTI_SELECT_ITEM) {
                //当多选框选项为ECUI控件时无法释放拦截，此处fix一下，by hades
                event.target = control.getOuter();
                return false;
            }
        }
        this.$getSection('Options').hide();
        triggerEvent(this, 'change');
        event.exit();
    };

    /**
     * 控件拥有焦点时，键盘按下/弹起事件的默认处理。
     * 如果控件处于可操作状态(参见 isEnabled)，keyup 方法触发 onkeyup 事件，如果事件返回值不为 false，则调用 $keyup 方法。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_CLASS.$keydown = UI_MULTI_SELECT_CLASS.$keypress = UI_MULTI_SELECT_CLASS.$keyup =
        function (event) {
            UI_INPUT_CONTROL_CLASS['$' + event.type].call(this, event);
            if (!this.$getSection('Options').isShow()) {
                return false;
            }

            var key = getKey();
            if (key == 13 || key == 32) {
                if (event.type == 'keyup') {
                    key = this.getActived();
                    key.setSelected(!key.isSelected());
                }
                return false;
            }
        };

    /**
     * 鼠标在控件区域滚动滚轮事件的默认处理。
     * 如果控件拥有焦点，则当前选中项随滚轮滚动而自动指向前一项或者后一项。如果控件处于可操作状态(参见 isEnabled)，mousewheel 方法触发 onmousewheel 事件，如果事件返回值不为 false，则调用 $mousewheel 方法。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_CLASS.$mousewheel = function (event) {
        var options = this.$getSection('Options');
        if (options.isShow()) {
            options.$mousewheel(event);
        }
        return false;
    };

    /**
     * 控件激活状态结束事件的默认处理。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_CLASS.$deactivate = UI_SELECT_CLASS.$deactivate;

    /**
     * 控件激活状态开始事件的默认处理。
     * @protected
     *
     * @param {Event} event 事件对象
     */
    UI_MULTI_SELECT_CLASS.$activate = function (event) {
        var con = event.getControl();
        if (!(con instanceof UI_MULTI_SELECT_ITEM)) {
            UI_SELECT_CLASS.$activate.call(this, event);
        }
    }

    /**
     * 控件自动渲染全部完成后的处理。
     * 页面刷新时，部分浏览器会回填输入框的值，需要在回填结束后触发设置控件的状态。
     * @protected
     */
    UI_MULTI_SELECT_CLASS.$ready = function () {
        UI_MULTI_SELECT_FLUSH_SELECTALL(this);
        UI_MULTI_SELECT_FLUSH_TEXT(this);

        if (this._bInitSelectAll) {
            for (var i = 0, list = this.getItems(), o; o = list[i++]; ) {
                !o._bSelectAllBtn && o.setSelected(true);
            }
        }
    };

    /**
     * 控件移除子控件事件的默认处理。
     * 选项组移除子选项时需要额外移除引用。
     * @protected
     *
     * @param {ecui.ui.Item} child 选项控件
     */
    UI_MULTI_SELECT_CLASS.$remove = function (item) {
        UI_SELECT_CLASS.$remove.call(this, item);
        this.getMain().removeChild(item._eInput);
    };

    /**
     * 设置控件的大小。
     * @protected
     *
     * @param {number} width 宽度，如果不需要设置则将参数设置为等价于逻辑非的值
     * @param {number} height 高度，如果不需要设置则省略此参数
     */
    UI_MULTI_SELECT_CLASS.$setSize = UI_SELECT_CLASS.$setSize;

    /**
     * 获取全部选中的选项控件。
     * @protected
     *
     * @return {Array} 选项控件列表
     */
    UI_MULTI_SELECT_CLASS.getSelected = function () {
        for (var i = 0, list = this.getItems(), o, result = []; o = list[i++]; ) {
            if (o.isSelected() && !o._bSelectAllBtn) {
                result.push(o);
            }
        }
        return result;
    };

    UI_MULTI_SELECT_CLASS.getValue = function () {
        var items = this.getSelected(),
            res = [], i, len;
        for (i = 0, len = items.length; i < len; i++) {
            if (!items[i]._bSelectAllBtn) {
                res.push(items[i]._eInput.value);
            }
        }
        return res;
    };

    /**
     * 获取全部选项的值
     * @return {Array} 所有选项的值的列表
     */
    UI_MULTI_SELECT_CLASS.getAllValue = function() {
        var items = this.getItems();
        var res = [];
        var i = 0;
        for (i = 0; i < items.length; i++) {
            if (!items[i]._bSelectAllBtn) {
                res.push(items[i].getValue());
            }
        }
        return res;
    };

    UI_MULTI_SELECT_CLASS.selectAll = function () {
        for (var i = 0, list = this.getItems(), o; o = list[i++]; ) {
            !o._bSelectAllBtn && o.setSelected(true);
        }
    };

    UI_MULTI_SELECT_CLASS.isSelectAll = function () {
        for (var i = 0, list = this.getItems(), o; o = list[i++]; ) {
            if (!o.isSelected()) {
                return false;
            }
        }
        return true;
    };

    /**
     * 设置下拉框允许显示的选项数量。
     * 如果实际选项数量小于这个数量，没有影响，否则将出现垂直滚动条，通过滚动条控制其它选项的显示。
     * @public
     *
     * @param {number} value 显示的选项数量，必须大于 1
     */
    UI_MULTI_SELECT_CLASS.setOptionSize = UI_SELECT_CLASS.setOptionSize;

    /**
     * 设置控件的值。
     * @public
     *
     * @param {Array/String} values 控件被选中的值列表
     */
    UI_MULTI_SELECT_CLASS.setValue = function (values) {
        if ('[object Array]' != Object.prototype.toString.call(values)) {
            values = values.toString().split(',');
        }
        for (var i = 0, list = this.getItems(), o; o = list[i++]; ) {
            o.setSelected(indexOf(values, o._eInput.value) >= 0);
        }
        UI_MULTI_SELECT_FLUSH_SELECTALL(this);
        UI_MULTI_SELECT_FLUSH_TEXT(this);
    };
//{/if}//
//{if 0}//
})();
//{/if}//

﻿/**
 * message-bar
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    message-bar.js
 * desc:    系统消息控件
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/20
 */
(function () {

    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        util = core.util,
        string = core.string,

        DOCUMENT = document,
        
        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        moveElements = dom.moveElements,
        getPosition = dom.getPosition,
        createDom = dom.create,
        children = dom.children,
        extend = util.extend,
        blank = util.blank,
        getByteLength = function (str) {
            return string.getByteLength(str, 'gbk');
        },
        sliceByte = function (str, length) {
            return string.sliceByte(str, length, 'gbk');
        },

        UI_CONTORL = ui.Control,
        UI_CONTORL_CLASS = UI_CONTORL.prototype,
        UI_ITEMS = ui.Items,

        UI_MESSAGE_BAR = ui.MessageBar = inheritsControl(
            UI_CONTORL,
            'ui-message-bar',
            function (el, options) {
                var o = createDom('', '', 'ul'),
                    type = this.getTypes()[0];

                moveElements(el, o, true);
                el.innerHTML = '<div class="'+ type +'-title"><span class="'+ type +'-title-icon"></span>系统消息</div><div class="'+ type +'-scroll-msg" style="display:none"><div class="'+ type +'-scroll-msg-inner" style="top:0px;left:0px">&nbsp;</div></div>';
                el.appendChild(o);
            },
            function (el, options) {
                BODY = DOCUMENT.body;

                var o = createDom('', 'display:none;position:absolute');

                this._nPIndex = 0;
                this._nSec = options.sec || 5000;
                this._nMaxLen = options.maxlength || 70;

                o.appendChild(el.lastChild);
                o.className = 'ui-message-bar-layer';
                BODY.appendChild(o);
                el = children(el);
                this.$setBody(o.firstChild);
                this._eScollMsg = el[1].firstChild;
                this._uLayer = $fastCreate(this.Layer, o, this);
                this.$initItems();
            }
        ),

        UI_MESSAGE_BAR_CLASS = UI_MESSAGE_BAR.prototype,
        UI_MESSAGE_BAR_LAYER = UI_MESSAGE_BAR_CLASS.Layer = inheritsControl(UI_CONTORL, 'ui-message-bar-layer'),
        UI_MESSAGE_BAR_LAYER_CLASS = UI_MESSAGE_BAR_LAYER.prototype;

    extend(UI_MESSAGE_BAR_CLASS, UI_ITEMS);

    /**
     * 切换消息动画
     * @private
     */
    function UI_MESSAGE_BAR_ANIMATE(con, height, nextText) {
        var el = con._eScollMsg;
        if (parseInt(el.style.top, 10) <= -height) {
            el.innerHTML = nextText;
            el.style.top = '0px';
            if (con._oTimer !== null) {
                con._oTimer = setTimeout(function () {
                    con.$play();
                }, con._nSec);
            }
        }
        else {
            el.style.top = (parseInt(el.style.top, 10) - 3) + 'px';
            setTimeout(function () {
                UI_MESSAGE_BAR_ANIMATE(con, height, nextText);
            }, 100);
        }
    }

    /**
     * 按长度截断文字并添加...
     * @private
     */
    function UI_MESSAGE_BAR_MSG(str, maxlen) {
        if (getByteLength(str) > maxlen) {
            str = sliceByte(str, maxlen - 2) + '...';
        }
        return str;
    }

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.init = function () {
        var items = this.getItems();

        UI_CONTORL_CLASS.init.call(this);
        UI_CONTORL_CLASS.init.call(this._uLayer);
        this.$alterItems();
        this.play();
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$mouseover = function () {
        var layer = this._uLayer,
            pos;

        if (this.getItems().length > 0) {
            pos = getPosition(this.getOuter());
            layer.show();
            layer.setPosition(pos.left, pos.top + this.getHeight());
            UI_CONTORL_CLASS.$activate.call(this);
            this.alterClass('+expend');
        }
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$mouseout = function () {
        this._uLayer.hide();
        this.alterClass('-expend');
    };

    /**
     * 开始消息循环轮换
     * 多次调用不会造成重入
     * @public
     */
    UI_MESSAGE_BAR_CLASS.play = function () {
        var me = this;
        if (this._oTimer) {
            return;
        }
        else {
            this._oTimer = setTimeout(function () {
                me.$play();
            }, this._nSec);
        }
    };

    /**
     * 消息循环轮换
     * 会判断如果只有一条消息则不会进行轮换
     * @private
     */
    UI_MESSAGE_BAR_CLASS.$play = function () {
        var items = this.getItems(), item,
            height = this._eScollMsg.offsetHeight,
            me = this, str;

        if (items.length > 1) {
            this._nPIndex = (this._nPIndex + 1) % items.length;
            item = items[this._nPIndex];
            str = UI_MESSAGE_BAR_MSG(item.getContent(), this._nMaxLen);
            this._eScollMsg.innerHTML += '<br />' + str;
            UI_MESSAGE_BAR_ANIMATE(this, height, str);
        }
        else if (items.length == 1) {
            this._eScollMsg.innerHTML = UI_MESSAGE_BAR_MSG(items[0].getContent(), this._nMaxLen);
            this._oTimer = null;
        }
    };

    /**
     * 停止消息循环轮换
     * @public
     */
    UI_MESSAGE_BAR_CLASS.stop = function () {
        clearTimeout(this._oTimer);
        this._oTimer = null;
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_LAYER_CLASS.$setSize = function () {
        var par = this.getParent();
        UI_CONTORL_CLASS.$setSize.call(this, par.getWidth());
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.add = function (item, index, options) {
        var str, o;

        if ('string' == typeof item) {
            o = createDom('', '', 'li');
            o.innerHTML = item;
            this.getBody().appendChild(o);
        }
        else {
            o = item;
        }
        item = UI_ITEMS.add.call(this, o, index, options);
        item.getOuter().style.overflow = '';
        return item;
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$alterItems = function () {
        var items = this.getItems(),
            el = this._eScollMsg;

        if (items.length > 0) {
            el.parentNode.style.display = '';
            if (el.innerHTML == '&nbsp;') {
                el.innerHTML = UI_MESSAGE_BAR_MSG(this.getItems()[0].getContent(), this._nMaxLen);
                this._nPIndex = 0;
            }
            this.play();
        }
        else {
            el.parentNode.style.display = 'none';
            el.innerHTML = '&nbsp';
            this.stop();
        }
    };
})();

(function () {
    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        util = core.util,
        string = core.string,

        $fastCreate = core.$fastCreate,
        setFocused = core.setFocused,
        createDom = dom.create,
        children = dom.children,
        last = dom.last,
        moveElements = dom.moveElements,
        getPosition  = dom.getPosition,
        setText = dom.setText,
        inheritsControl = core.inherits,
        isContentBox = core.isContentBox,
        getStatus = core.getStatus,
        getView = util.getView,
        triggerEvent = core.triggerEvent,
        trim = string.trim,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,

        UI_TIP_TIME_OPEN = 500,
        UI_TIP_TIME_CLOSE = 200,
        REPAINT = core.REPAINT,

        uiPsTipLayer = null;

    var UI_TIP = ui.Tip = 
        inheritsControl(
            UI_CONTROL,
            'ui-tip',
            function(el, options) {
                options.message = trim(el.innerHTML) || options.message;
                el.innerHTML = '';
            },
            function (el, options) {
                this._sTarget = options.target;
                this._sMessage = options.message;
                this._oTimer = null;
                this._bAsyn = options.asyn === true;
                this._bLoad = false;
            }
        ),

        UI_TIP_CLASS = UI_TIP.prototype,
        UI_TIP_LAYER = UI_TIP_CLASS.Layer = 
        inheritsControl(
            UI_CONTROL,
            'ui-tip-layer',
            function (el, options) {
                el.appendChild(createDom(this.getTypes() + '-corner'));
                el.appendChild(createDom());
            },
            function (el, options) {
                el = children(el);
                this._eCorner = el[0];
                this.$setBody(el[1]);
            }
        ),

        UI_TIP_LAYER_CLASS = UI_TIP_LAYER.prototype;


    function UI_TIP_LAYER_GET() {
        var o;
        if (!uiPsTipLayer) {
            o = document.body.appendChild(createDom(UI_TIP_LAYER.TYPES));
            uiPsTipLayer = $fastCreate(UI_TIP_LAYER, o);
            uiPsTipLayer.cache();
            uiPsTipLayer.init();
        }
        return uiPsTipLayer;
    }


    UI_TIP_CLASS.$mouseover = function () {
        var con = this;
        UI_CONTROL_CLASS.$mouseover.call(this);
        clearTimeout(this._oTimer);
        if (!this._bShow) {
            if (this._bAsyn) {
                var layer = UI_TIP_LAYER_GET();
                this.close();
                con._oTimer = setTimeout(function () {
                        con._bLoad = false;
                        triggerEvent(con, 'loadData', function () {
                            con.open();
                        });
                    }, UI_TIP_TIME_OPEN);
            }
            else {
                this._oTimer = setTimeout(function () {
                    con.open();
                }, UI_TIP_TIME_OPEN);
            }
        }
    }

    UI_TIP_CLASS.$mouseout = function () {
        var con = this;
        UI_CONTROL_CLASS.$mouseout.call(this);
        clearTimeout(this._oTimer);
        if (this._bShow) {
            this._oTimer = setTimeout(function () {
                con.close()
            }, UI_TIP_TIME_CLOSE);
        }
    }

    UI_TIP_CLASS.$getTarget = function (id) {
        return document.getElementById(id);
    }

    UI_TIP_CLASS.setTarget = function (id) {
        this._sTarget = id;
    }

    UI_TIP_CLASS.open = function () {
        var layer = UI_TIP_LAYER_GET();

        if (this._sTarget) {
            var o = this.$getTarget(this._sTarget);
            if (o) {
                if ('[object String]' == Object.prototype.toString.call(o)) {
                    layer.getBody().innerHTML = o;
                }
                else {
                    layer.getBody().innerHTML = o.innerHTML;
                }
            }
        }
        else if (this._sMessage) {
            layer.setContent(this._sMessage);
        }

        layer.show(this);
        this._bShow = true;
    }

    UI_TIP_CLASS.close = function () {
        UI_TIP_LAYER_GET().hide();
        this._bShow = false;
    }

    UI_TIP_LAYER_CLASS.show = function (con) {
        var pos = getPosition(con.getOuter()),
            type = this.getTypes()[0],
            view = getView(),
            cornerHeight = 13,
            w = con.getWidth(), h = con.getHeight(),
            wFix = 9, hFix = 13,
            className = [];

        if (con) {
            this._uHost = con;
        }

        UI_CONTROL_CLASS.show.call(this);
        this.resize();
        if (pos.left + this.getWidth() > view.right) {
            pos.left = pos.left + w - this.getWidth() + wFix;
            className.push('-right')
        }
        else {
            pos.left = pos.left - wFix;
            className.push('-left');
        }

        if (pos.top - cornerHeight - this.getHeight() < view.top 
                && pos.top + h + cornerHeight + this.getHeight() < view.bottom) {
            pos.top += h + cornerHeight;
            className.push('-bottom');
        }
        else {
            pos.top -= cornerHeight + this.getHeight();
            className.push('-top');
        }

        this._eCorner.className = type + '-corner ' + type + '-corner' + className.join('');
        this.setPosition(pos.left, pos.top);
    }

    UI_TIP_LAYER_CLASS.$mouseover = function () {
        UI_CONTROL_CLASS.$mouseover.call(this);
        this._uHost.$mouseover();
    }

    UI_TIP_LAYER_CLASS.$mouseout = function () {
        UI_CONTROL_CLASS.$mouseout.call(this);
        this._uHost.$mouseout();
    }

    UI_TIP_LAYER_CLASS.$resize = function () {
         var el = this._eMain,
            currStyle = el.style;

        currStyle.width = this._sWidth;
        currStyle.height = this._sHeight;
        this.repaint();
    }
})();

/**
 * input
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    input.js
 * desc:    文本输入框(input与textarea)
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/12
 */
(function () {

    var core = ecui,
        dom = core.dom,
        string = core.string,
        ui = core.ui,
        util = core.util,

        attachEvent = util.attachEvent,
        createDom = dom.create,
        trim = string.trim,
        setFocused = core.setFocused,
        blank = util.blank,

        inheritsControl = core.inherits,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,


        UI_INPUT = ui.Input = inheritsControl(
            UI_INPUT_CONTROL,
            'ui-input',
            function (el, options) {
                options.resizable = false;
            },
            function (el, options) {
                var o, type = this.getType();
                
                this.getInput().style.border = '';

				if(options.maxLength){
					this._sMaxLength = options.maxLength;
				}


                if (options.tip) {
                    o = createDom(type + '-tip', 'display:none');
                    o.innerHTML = options.tip;
                    this.getBody().appendChild(o);
                    this._eTip = o;
                    attachEvent(this._eTip, 'mousedown', UI_INPUT_TIP_HANDLER);
                }
            }
        ),
        UI_INPUT_CLASS = UI_INPUT.prototype,

        UI_TEXTAREA = ui.Textarea = inheritsControl(
            UI_INPUT,
            'ui-textarea',
            function (el, options) {
                options.inputType = 'textarea';
            }
        );

    function UI_INPUT_TIP_HANDLER(event) {
        var e = event || window.event,
            con;

        if (e.preventDefault) {
            e.preventDefault();
        }
        else {
            e.cancelBuble = true;
        }
        e = e.target || e.srcElement;
        con = e.parentNode.getControl();
        con.getInput().focus();
    }

    function UI_INPUT_TIP_DISPLAY(con, show) {
        if (con._eTip) {
            con._eTip.style.display = show ? '' : 'none';
        }
    }

    UI_INPUT_CLASS.$keydown = function () {
    	
        UI_INPUT_TIP_DISPLAY(this, false);
    };

    UI_INPUT_CLASS.$keyup = function () {
        var value = this.getValue();
        
        if(this._sMaxLength){
        	if(baidu.string.getByteLength(value) > this._sMaxLength){
        		this.setValue(baidu.string.subByte(value, this._sMaxLength));
        	}
        }
        
        if (!value) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
    };

    UI_INPUT_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
        if (!this.getValue()) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
    };

    UI_INPUT_CLASS.$setSize = blank;

    UI_INPUT_CLASS.setValue = function (value) {
        UI_INPUT_CONTROL_CLASS.setValue.call(this, value);
        UI_INPUT_TIP_DISPLAY(this, value ? false : true);
    };

    UI_INPUT_CLASS.init = function () {
        if (!this.getValue()) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
        UI_INPUT_CONTROL_CLASS.init.call(this);
    };
})();

/*
 MonthViewOnly - 定义月日历显示的基本操作。

 */
//{if 0}//
(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,

        DATE = Date,

        indexOf = array.indexOf,
        addClass = dom.addClass,
        getParent = dom.getParent,
        removeClass = dom.removeClass,
        setText = dom.setText,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control;
//{/if}//
//{if $phase == "define"}//
    ///__gzip_original__UI_MONTH_VIEW
    ///__gzip_original__UI_MONTH_VIEW_CLASS
    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    控件的年份
     * month   控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_MONTH_VIEW_ONLY = ui.MonthViewOnly =
            inheritsControl(
                UI_CONTROL,
                'ui-monthviewonly',
                function (el, options) {
                    var type = this.getType(),
                        list = [];
                    el.style.overflow = 'auto';

                    for (var i = 0; i < 12; i++) {
                        list.push('<td class="' + type + '-item'
                            +   this.Cell.TYPES + '">'
                            +   UI_MONTH_VIEW_ONLY.MONTH[i] + "月"
                            +   '</td>'
                            +   ((i + 1) % 3 ? '' : '</tr><tr>'));
                    }

                    el.innerHTML =
                        '<table cellspacing="0"><tbody><tr>'
                            +       list.join('')
                            +   '</tr></tbody></table>';
                },
                function (el, options) {
                    this._aCells = [];
                    for (var i = 0, list = el.getElementsByTagName('TD'), o;
                         o = list[i]; )
                    {
                        // 日历视图单元格禁止改变大小
                        var cell = $fastCreate(
                            this.Cell, o, this,
                            {resizable: false}
                        );
                        cell._nMonth = i + 1;
                        this._aCells[i++] = cell;
                    }
                    this._nMonth = options.month || 1;
                    this._nYear = options.year || (new Date()).getFullYear();
                    this.setView(this._nYear, this._nMonth);
                }
            ),
        UI_MONTH_VIEW_ONLY_CLASS = UI_MONTH_VIEW_ONLY.prototype,

        /**
         * 初始化日历控件的单元格部件。
         * @public
         *
         * @param {Object} options 初始化选项
         */
            UI_MONTH_VIEW_ONLY_CELL_CLASS = (UI_MONTH_VIEW_ONLY_CLASS.Cell =
            inheritsControl(UI_CONTROL)).prototype;
//{else}//
    UI_MONTH_VIEW_ONLY.MONTH = ['一', '二', '三', '四', '五', '六', '七',"八","九","十","十一","十二"];

    /**
     * 选中某个日期单元格
     * @private
     *
     * @param {Object} 日期单元格对象
     */
    function UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(control, o) {
        if (control._uSelected == o) {
            return;
        }

        if (control._uSelected) {
            control._uSelected.alterClass('-selected');
        }

        if (o) {
            o.alterClass('+selected');
        }
        control._uSelected = o;
    }

    /**
     * 点击时，根据单元格类型触发相应的事件。
     * @override
     */
    UI_MONTH_VIEW_ONLY_CELL_CLASS.$click = function (event) {
        var parent = this.getParent();
        var curMonth = parent._nMonth;

        //change事件可以取消，返回false会阻止选中
        if (curMonth != this._nMonth) {
            parent._nMonth = this._nMonth;
            triggerEvent(parent, 'change', event, [this._nMonth]);
            UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(parent, this);
        }
    };

    /**
     * 获取日历控件当前显示的月份。
     * @public
     *
     * @return {number} 月份(1-12)
     */
    UI_MONTH_VIEW_ONLY_CLASS.getMonth = function () {
        return this._nMonth;
    };

    /**
     * 获取日历控件当前显示的年份。
     * @public
     *
     * @return {number} 年份(19xx-20xx)
     */
    UI_MONTH_VIEW_ONLY_CLASS.getYear = function () {
        return this._nYear;
    };

    /**
     * 日历显示移动指定的月份数。
     * 参数为正整数则表示向当前月份之后的月份移动，
     * 负数则表示向当前月份之前的月份移动，设置后日历控件会刷新以显示新的日期。
     * @public
     *
     * @param {number} offsetMonth 日历移动的月份数
     */
    UI_MONTH_VIEW_ONLY_CLASS.move = function (offsetMonth) {
        this.setView(this._nYear, this._nMonth + offsetMonth);
    };

    UI_MONTH_VIEW_ONLY_CLASS.clear = function () {
        this._uSelected = null;
        for (var i = 0, item;  item = this._aCells[i++];) {
            item.alterClass('-selected');
        }
    };

    /**
     * 设置日历控件当前显示的月份。
     * @public
     *
     * @param {number} year 年份(19xx-20xx)，如果省略使用浏览器的当前年份
     * @param {number} month 月份(1-12)，如果省略使用浏览器的当前月份
     */
    UI_MONTH_VIEW_ONLY_CLASS.setView = function (year, month) {
        this._nYear = year;
        this._nMonth = month;
        UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(this, this._aCells[month-1]);
    };
})();


(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        util = core.util,

        DATE = Date,
        REGEXP = RegExp,
        DOCUMENT = document,

        pushArray = array.push,
        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        getPosition = dom.getPosition,
        moveElements = dom.moveElements,
        setText = dom.setText,
        formatDate = string.formatDate,
        getView = util.getView,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_SELECT = ui.Select,
        BEGIN_YEAR = 2002,
        END_YEAR = (new Date()).getFullYear(),
        UI_MONTH_VIEW_ONLY = ui.MonthViewOnly,
        UI_MONTH_VIEW_CELL = UI_MONTH_VIEW_ONLY.Cell;

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_MONTH_CALENDAR = ui.MonthCalendar =
            inheritsControl(
                UI_INPUT_CONTROL,
                'ui-month-calendar',
                function(el, options) {
                    var type = this.getTypes()[0];

                    options.hidden = true;
                    el.innerHTML = '<span class="'+ type +'-text"></span>' +
                        '<span class="'+ type +'-cancel"></span>' +
                        '<span class="'+ type +'-button"></span>';
                },
                function(el, options) {
                    var child = children(el),
                        type = this.getTypes()[0],
                        o = createDom(type + '-panel',
                            'position:absolute;display:none');

                    this._bTip = options.tip !== false;
                    this._nYear = options.year;
                    this._nMonth = options.month;

                    this._eText = child[0];

                    this._uCancel = $fastCreate(this.Cancel, child[1], this);
                    this._uButton = $fastCreate(UI_CONTROL, child[2], this);

                    DOCUMENT.body.appendChild(o);
                    this._uPanel = $fastCreate(this.Panel, o, this, options);

                    if (options.hideCancel == true) {
                        this._bHideCancel = true;
                        this._uCancel.$hide();
                    }
                }
            ),

        UI_MONTH_CALENDAR_CLASS = UI_MONTH_CALENDAR.prototype,
        UI_MONTH_CALENDAR_CANCEL_CLASS = (UI_MONTH_CALENDAR_CLASS.Cancel = inheritsControl(UI_CONTROL)).prototype,

        UI_MONTH_CALENDAR_PANEL = UI_MONTH_CALENDAR_CLASS.Panel =
            inheritsControl(
                UI_CONTROL,
                'ui-month-calendar-panel',
                function(el, options) {
                    var html = [],
                        year = (new DATE()).getFullYear(),
                        beginYear = options.beginYear || BEGIN_YEAR,
                        endYear = options.endYear || END_YEAR,
                        type = this.getTypes()[0];

                    html.push('<div class="'+ type +'-buttons"><div class="'+ type +'-btn-prv'+ UI_BUTTON.TYPES +'"></div>' +
                        '<select class="'+ type +'-slt-year'+ UI_SELECT.TYPES +'">');
                    for(var i = beginYear; i < endYear + 1; i ++) {
                        html.push('<option value="'+ i +'">'+ i +'</option>');
                    }
                    html.push('</select>');
                    html.push('<div class="'+ type +'-btn-nxt'+ UI_BUTTON.TYPES +'"></div></div>');
                    html.push('<div class="'+ type +'-month-view'+ UI_MONTH_VIEW_ONLY.TYPES +'"></div>');
                    el.innerHTML = html.join('');
                },
                function (el, options) {
                    var html = [], o, i,
                        type = this.getTypes()[0],
                        buttonClass = this.Button,
                        selectClass = this.Select,
                        beginYear = options.beginYear || BEGIN_YEAR,
                        endYear = options.endYear || END_YEAR,
                        monthViewClass = this.MonthViewOnly;

                    el = children(el);
                    o = children(el[0]);
                    this._beginYear = beginYear;
                    this._endYear = endYear;
                    this._uPrvBtn = $fastCreate(buttonClass, o[0], this);
                    this._uPrvBtn._nStep = -1;
                    this._uYearSlt = $fastCreate(selectClass, o[1], this);
                    this._uNxtBtn = $fastCreate(buttonClass, o[2], this);
                    this._uNxtBtn._nStep = 1;

                    el = el[1];
                    this._uMonthView = $fastCreate(monthViewClass, el, this);
                    this._uYearSlt.setValue((new Date()).getFullYear());
                }
            ),

        UI_MONTH_CALENDAR_PANEL_CLASS = UI_MONTH_CALENDAR_PANEL.prototype,
        UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.Button = inheritsControl(UI_BUTTON, null)).prototype,
        UI_MONTH_CALENDAR_PANEL_SELECT_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.Select = inheritsControl(UI_SELECT, null)).prototype,
        UI_MONTH_CALENDAR_PANEL_MONTHVIEW_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.MonthViewOnly = inheritsControl(UI_MONTH_VIEW_ONLY, null)).prototype,

        UI_MONTH_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>';

    // 是否显示取消按钮
    function UI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.hide();
            if (con._bTip) {
                el.innerHTML = UI_MONTH_CALENDAR_STR_DEFAULT;
            }
        }
        else if (!con._bHideCancel) {
            con._uCancel.show();
        }
    }

    /**
     * 获得单日历控件的年份
     */
    UI_MONTH_CALENDAR_CLASS.getYear = function () {
        return this._nYear;
    };
    /**
     * 获得单日历控件的月份
     */
    UI_MONTH_CALENDAR_CLASS.getMonth = function () {
        return this._nMonth;
    };

    /**
     * @func 设置日期
     * @param date
     */
    UI_MONTH_CALENDAR_CLASS.setDate = function (year, month) {
        var ntxt = year && month ?
            year + "年" + (month > 9 ? month : "0" + month) + "月" :
            "";

        // 隐藏面板
        if (this._uPanel.isShow()) {
            this._uPanel.hide();
        }
        // 设置输入框的值
        this._eText.innerHTML = ntxt;
        // 设置日期控件的值为选中的值
        this.setValue(ntxt);
        this._nYear = year ;
        this._nMonth = month;
        // 是否显示 清除按钮
        UI_CALENDAR_TEXT_FLUSH(this);
    };

    // 激活日期控件，显示面板
    UI_MONTH_CALENDAR_CLASS.$activate = function (event) {
        var panel = this._uPanel, con,
            pos = getPosition(this.getOuter()),
            posTop = pos.top + this.getHeight();

        UI_INPUT_CONTROL_CLASS.$activate.call(this, event);
        if (!panel.isShow()) {
            panel.setDate(this._nYear, this._nMonth);
            con = getView();
            panel.show();
            panel.setPosition(
                pos.left + panel.getWidth() <= con.right ? pos.left : con.right - panel.getWidth() > 0 ? con.right - panel.getWidth() : 0,
                posTop + panel.getHeight() <= con.bottom ? posTop : pos.top - panel.getHeight() > 0 ? pos.top - panel.getHeight() : 0
            );
            setFocused(panel);
        }
    };

    UI_MONTH_CALENDAR_CLASS.$cache = function (style, cacheSize) {
        UI_INPUT_CONTROL_CLASS.$cache.call(this, style, cacheSize);
        this._uButton.cache(false, true);
        this._uPanel.cache(true, true);
    };

    // month-calendar 的初始化函数，每次初始化这个控件时都会调用
    UI_MONTH_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate(this._nYear, this._nMonth);
        this._uPanel.init();
    };

    // calendar清空函数，回到原始状态
    UI_MONTH_CALENDAR_CLASS.clear = function () {
        this.setDate();
    };

    // 删除按钮的点击事件
    UI_MONTH_CALENDAR_CANCEL_CLASS.$click = function () {
        var par = this.getParent();

        UI_CONTROL_CLASS.$click.call(this);
        par.clear();
    };

    UI_MONTH_CALENDAR_CANCEL_CLASS.$activate = UI_BUTTON_CLASS.$activate;

    /**
     * Panel
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.$blur = function () {
        this.hide();
    };

    /**
     * 设置日历面板的日期
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.setDate = function (year, month) {
        var today = new Date();
        year = year || today.getFullYear();

        this._uYearSlt.setValue(year);
        this._uMonthView.setView(year, month);
        this.setView(year, month);
    };

    /**
     * 设置日历面板的展现年月
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.setView = function (year, month) {
        var yearSlt = this._uYearSlt,
            monthView = this._uMonthView;

        year = year || (new Date()).getFullYear();
        yearSlt.setValue(year);
        year && monthView.setView(year, month);
    };

    /**
     * 获取当前日历面板视图的年
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.getViewYear = function () {
        return this._uMonthView.getYear();
    };

    /**
     * 获取当前日历面板视图的月
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.getViewMonth = function () {
        return this._uMonthView.getMonth();
    };

    UI_MONTH_CALENDAR_PANEL_CLASS.$cache = function (style, cacheSize) {
        this._uPrvBtn.cache(true, true);
        this._uNxtBtn.cache(true, true);
        this._uYearSlt.cache(true, true);
        this._uMonthView.cache(true, true);
        UI_CONTROL_CLASS.$cache.call(this, style, cacheSize);
    };

    UI_MONTH_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uYearSlt.init();
        this._uMonthView.init();
    };

    //面板的change事件
    UI_MONTH_CALENDAR_PANEL_CLASS.$change = function (event, month) {
        var par = this.getParent();
        var year = this._uYearSlt.getValue();
        if (triggerEvent(par, 'change', event, [year,month])) {
            par.setDate(year, month);
        }
        this.hide();
    };

    // 年选择框的change事件
    UI_MONTH_CALENDAR_PANEL_SELECT_CLASS.$change = function () {
        var panel = this.getParent(),
            view = panel.getParent(),
            yearSlt = panel._uYearSlt;
        var month = view._nYear == yearSlt.getValue() ? view._nMonth : null;
        panel.setView(yearSlt.getValue(), month);
    };
    /*UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
     var step = this._nStep,
     panel = this.getParent(),
     date;

     date = new DATE(panel.getViewYear(), panel.getViewMonth() - 1 + step, 1);
     panel.setView(date.getFullYear(), date.getMonth() + 1);
     };*/

    // 点击 向前， 向后两个按钮的事件
    UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var step = this._nStep,
            panel = this.getParent(),
            view = panel.getParent(),
            date;
        var curYear = panel._uYearSlt.getValue();
        var nextYear = curYear-0 + step;
        if (nextYear < panel._beginYear) {
            nextYear = panel._endYear;
        }
        if (nextYear > panel._endYear) {
            nextYear = panel._beginYear;
        }
        panel._uMonthView.clear();
        if (nextYear == view._nYear) {
            panel._uMonthView.setView(nextYear, panel.getViewMonth());
        }
        panel._uYearSlt.setValue(nextYear);
    };

    // 重写moth-view-only的change方法
    UI_MONTH_CALENDAR_PANEL_MONTHVIEW_CLASS.$change = function (event, month) {
        triggerEvent(this.getParent(), 'change', event, [month]);
    };
})();

(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        util = core.util,

        DATE = Date,
        REGEXP = RegExp,
        DOCUMENT = document,

        pushArray = array.push,
        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        getPosition = dom.getPosition,
        moveElements = dom.moveElements,
        setText = dom.setText,
        formatDate = string.formatDate,
        getView = util.getView,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_SELECT = ui.Select,
        UI_MONTH_VIEW = ui.MonthView,
        UI_MONTH_VIEW_CELL = UI_MONTH_VIEW.Cell;

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_CALENDAR = ui.Calendar =
        inheritsControl(
            UI_INPUT_CONTROL,
            'ui-calendar',
            function (el, options) {
                var type = this.getTypes()[0];

                options.hidden = true;
                el.innerHTML = '<span class="'+ type +'-text"></span><span class="'+ type +'-cancel"></span><span class="'+ type +'-button"></span>';
            },
            function (el, options) {
                var child = children(el),
                    type = this.getTypes()[0],
                    o = createDom(type + '-panel', 'position:absolute;display:none');

                this._bTip = options.tip !== false;

                if (options.date) {
                    var date = options.date.split('-');
                    this._oDate = new DATE(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10));
                }
                else if (options.date === false) {
                    this._oDate = null
                }
                else {
                    this._oDate = new DATE();
                }
                var range = UI_CALENDAR_PARSE_RANGE(options.start, options.end);

                this._eText = child[0];

                this._uCancel = $fastCreate(this.Cancel, child[1], this);
                this._uButton = $fastCreate(UI_CONTROL, child[2], this);

                this._bCancelButton = options.cancelButton !== false;
                if (!this._bCancelButton) {
                    this._uCancel.$hide();
                }

                DOCUMENT.body.appendChild(o);
                this._uPanel = $fastCreate(this.Panel, o, this, {date: this._oDate, range: range});
            }
        ),

        UI_CALENDAR_CLASS = UI_CALENDAR.prototype,
        UI_CALENDAR_CANCEL_CLASS = (UI_CALENDAR_CLASS.Cancel = inheritsControl(UI_CONTROL)).prototype,

        UI_CALENDAR_PANEL = UI_CALENDAR_CLASS.Panel = 
        inheritsControl(
            UI_CONTROL,
            'ui-calendar-panel',
            function (el, options) {
                var html = [],
                    year = (new DATE()).getFullYear(),
                    type = this.getTypes()[0];
                var today = new Date();
                var startYear = today.getFullYear() - 5;
                var endYear = today.getFullYear() + 5;
                var startDate = options.range.begin;
                var endDate = options.range.end;
                if (startDate) {
                    startYear = startDate.getFullYear();
                }
                if (endDate) {
                    endYear = endDate.getFullYear();
                }
                html.push('<div class="'+ type +'-buttons"><div class="'+ type +'-btn-prv'+ UI_BUTTON.TYPES +
                    '"></div><select class="'+ type +'-slt-year'+ UI_SELECT.TYPES +'">');

                for (var  i = startYear; i <= endYear; i ++) {
                    html.push('<option value="'+ i +'">'+ i +'</option>');
                }

                html.push('</select><select class="'+ type +'-slt-month'+ UI_SELECT.TYPES +'">');

                for (var i = 1; i <= 12; i++) {
                    html.push('<option value="'+ i +'">'+ (i < 10 ? '0' : '') + i +'</option>');
                }

                html.push('</select><div class="'+ type +'-btn-nxt'+ UI_BUTTON.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-month-view'+ UI_MONTH_VIEW.TYPES +'"></div>');
                el.innerHTML = html.join('');
            },
            function (el, options) {
                var html = [], o, i,
                    type = this.getTypes()[0],
                    buttonClass = this.Button,
                    selectClass = this.Select,
                    monthViewClass = this.MonthView,
                    date = options.date;
                
                el = children(el);
                o = children(el[0]);

                this._uPrvBtn = $fastCreate(buttonClass, o[0], this);
                this._uPrvBtn._nStep = -1;
                this._uYearSlt = $fastCreate(selectClass, o[1], this);
                this._uMonthSlt = $fastCreate(selectClass, o[2], this);
                this._uNxtBtn = $fastCreate(buttonClass, o[3], this);
                this._uNxtBtn._nStep = 1;

                el = el[1];
                this._uMonthView = $fastCreate(monthViewClass, el, this,
                    {
                        begin: options.range.begin,
                        end: options.range.end
                    }
                );
            }
        ),

        UI_CALENDAR_PANEL_CLASS = UI_CALENDAR_PANEL.prototype,
        UI_CALENDAR_PANEL_BUTTON_CLASS = (UI_CALENDAR_PANEL_CLASS.Button = inheritsControl(UI_BUTTON, null)).prototype,
        UI_CALENDAR_PANEL_SELECT_CLASS = (UI_CALENDAR_PANEL_CLASS.Select = inheritsControl(UI_SELECT, null)).prototype,
        UI_CALENDAR_PANEL_MONTHVIEW_CLASS = (UI_CALENDAR_PANEL_CLASS.MonthView = inheritsControl(UI_MONTH_VIEW, null)).prototype,

        UI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>',
        UI_CALENDAR_STR_PATTERN = 'yyyy-MM-dd';


    function UI_CALENDAR_PARSE_RANGE(begin, end) {
        var now = new Date(), res = null,
            o = [now.getFullYear(), now.getMonth(), now.getDate()], t,
            p = {y:0, M:1, d:2};
        if (begin instanceof Date) {
            res = res || {};
            res.begin = begin;
        }
        else if (/^([-+]?)(\d+)([yMd])$/.test(begin)) {
            res = res || {};
            t = o.slice();
            if (!REGEXP.$1 || REGEXP.$1 == '+') {
                t[p[REGEXP.$3]] -= parseInt(REGEXP.$2, 10);
            }
            else {
                t[p[REGEXP.$3]] += parseInt(REGEXP.$2, 10);
            }
            res.begin = new Date(t[0], t[1], t[2]);
        }
        else if ('[object String]' == Object.prototype.toString.call(begin)) {
            res = res || {};
            begin = begin.split('-');
            res.begin = new Date(parseInt(begin[0], 10), parseInt(begin[1], 10) - 1, parseInt(begin[2], 10));
        }

        if (end instanceof Date) {
            res = res || {};
            res.end = end;
        }
        else if (/^([-+]?)(\d+)([yMd])$/.test(end)) {
            res = res || {};
            t = o.slice();
            if (!REGEXP.$1 || REGEXP.$1 == '+') {
                t[p[REGEXP.$3]] += parseInt(REGEXP.$2, 10);
            }
            else {
                t[p[REGEXP.$3]] -= parseInt(REGEXP.$2, 10);
            }
            res.end = new Date(t[0], t[1], t[2]);
        }
        else if ('[object String]' == Object.prototype.toString.call(end)) {
            res = res || {};
            end = end.split('-');
            res.end = new Date(parseInt(end[0], 10), parseInt(end[1], 10) - 1, parseInt(end[2], 10));
        }

        return res ? res : {};
    }

    function UI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.$hide();
            if (con._bTip) {
                el.innerHTML = UI_CALENDAR_STR_DEFAULT;
            }
        }
        else if (con._bCancelButton){
            con._uCancel.show();
        }
    }

    /**
     * 获得单日历控件的日期
     */
    UI_CALENDAR_CLASS.getDate = function () {
        return this._oDate;
    };

    UI_CALENDAR_CLASS.setDate = function (date) {
        var panel = this._uPanel,
            ntxt = date != null ? formatDate(date, UI_CALENDAR_STR_PATTERN) : '';

        if (this._uPanel.isShow()) {
            this._uPanel.hide();
        }

        this._eText.innerHTML = ntxt;
        UI_INPUT_CONTROL_CLASS.setValue.call(this, ntxt);
        this._oDate = date;
        UI_CALENDAR_TEXT_FLUSH(this);
    };

    UI_CALENDAR_CLASS.setValue = function (str) {
        if (!str) {
            this.setDate(null);
        }
        else {
            str = str.split('-');
            this.setDate(new Date(parseInt(str[0], 10), parseInt(str[1], 10) - 1, parseInt(str[2], 10)));
        }
    };

    UI_CALENDAR_CLASS.$activate = function (event) {
        var panel = this._uPanel, con,
            pos = getPosition(this.getOuter()),
            posTop = pos.top + this.getHeight();

        UI_INPUT_CONTROL_CLASS.$activate.call(this, event);
        if (!panel.isShow()) {
            panel.setDate(this.getDate());
            con = getView();
            panel.show();
            panel.setPosition(
                pos.left + panel.getWidth() <= con.right ? pos.left : con.right - panel.getWidth() > 0 ? con.right - panel.getWidth() : 0,
                posTop + panel.getHeight() <= con.bottom ? posTop : pos.top - panel.getHeight() > 0 ? pos.top - panel.getHeight() : 0
            );
            setFocused(panel);
        }
    };

    UI_CALENDAR_CLASS.$cache = function (style, cacheSize) {
        UI_INPUT_CONTROL_CLASS.$cache.call(this, style, cacheSize);
        this._uButton.cache(false, true);
        this._uPanel.cache(true, true);
    };

    UI_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate(this._oDate);
        this._uPanel.init();
    };

    UI_CALENDAR_CLASS.clear = function () {
        this.setDate(null);
    };

    UI_CALENDAR_CLASS.setRange = function (begin, end) {
        this._uPanel._uMonthView.setRange(begin, end);
    };

    UI_CALENDAR_CANCEL_CLASS.$click = function () {
        var par = this.getParent(),
            panel = par._uPanel;

        UI_CONTROL_CLASS.$click.call(this);
        par.setDate(null);
    };

    UI_CALENDAR_CANCEL_CLASS.$activate = UI_BUTTON_CLASS.$activate;

    /**
     * Panel
     */
    UI_CALENDAR_PANEL_CLASS.$blur = function () {
        this.hide();
    };

    /**
     * 设置日历面板的日期
     */
    UI_CALENDAR_PANEL_CLASS.setDate = function (date) {
        var year = date != null ? date.getFullYear() : (new Date()).getFullYear(),
            month = date != null ? date.getMonth() + 1 : (new Date()).getMonth() + 1;

        this._uMonthView.$setDate(date);
        this.setView(year, month);
    };

    /**
     * 设置日历面板的展现年月 
     */
    UI_CALENDAR_PANEL_CLASS.setView = function (year, month) {
        var monthSlt = this._uMonthSlt,
            yearSlt = this._uYearSlt,
            monthView = this._uMonthView;

        yearSlt.setValue(year);
        monthSlt.setValue(month);
        monthView.setView(year, month);
    };

    /**
     * 获取当前日历面板视图的年
     */
    UI_CALENDAR_PANEL_CLASS.getViewYear = function () {
        return this._uMonthView.getYear();
    };

    /**
     * 获取当前日历面板视图的月
     */
    UI_CALENDAR_PANEL_CLASS.getViewMonth = function () {
        return this._uMonthView.getMonth();
    };

    UI_CALENDAR_PANEL_CLASS.$cache = function (style, cacheSize) {
        this._uPrvBtn.cache(true, true);
        this._uNxtBtn.cache(true, true);
        this._uMonthSlt.cache(true, true);
        this._uYearSlt.cache(true, true);
        this._uMonthView.cache(true, true);
        UI_CONTROL_CLASS.$cache.call(this, style, cacheSize);
    };

    UI_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uMonthSlt.init();
        this._uYearSlt.init();
        this._uMonthView.init();
    };

    UI_CALENDAR_PANEL_CLASS.$change = function (event, date) {
        var par = this.getParent();
        if (triggerEvent(par, 'change', event, [date])) {
            par.setDate(date);
        }
        this.hide();
    };

    UI_CALENDAR_PANEL_SELECT_CLASS.$change = function () {
        var panel = this.getParent(),
            yearSlt = panel._uYearSlt,
            monthSlt = panel._uMonthSlt;

        panel.setView(yearSlt.getValue(), monthSlt.getValue());
    };

    UI_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var step = this._nStep,
            panel = this.getParent(),
            date;

        date = new DATE(panel.getViewYear(), panel.getViewMonth() - 1 + step, 1);
        panel.setView(date.getFullYear(), date.getMonth() + 1);
    };

    UI_CALENDAR_PANEL_MONTHVIEW_CLASS.$change = function (event, date) {
        triggerEvent(this.getParent(), 'change', event, [date]);
    };

})();

(function () {

    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,

        DATE = Date,
        REGEXP = RegExp,
        DOCUMENT = document,

        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        moveElements = dom.moveElements,
        formatDate = string.formatDate,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_CALENDAR = ui.Calendar,
        UI_CALENDAR_CLASS = UI_CALENDAR.prototype,
        UI_CALENDAR_CANCEL_CLASS = UI_CALENDAR_CLASS.Cancel.prototype,
        UI_CALENDAR_PANEL = UI_CALENDAR_CLASS.Panel,

        UI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>',
        UI_MULTI_CALENDAR_STR_DEFAULT = '<span class="ui-multi-calendar-default">请选择时间范围</span>',
        UI_CALENDAR_STR_PATTERN = 'yyyy-MM-dd';

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */

    var UI_MULTI_CALENDAR = ui.MultiCalendar = 
        inheritsControl(
            UI_CALENDAR,
            'ui-multi-calendar',
            function (el, options) {
                options.hidden = true;
                options.yearRange && (this._nYearRange = options.yearRange - 0);
                if (options.remind) {
                    UI_MULTI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">'
                        + options.remind
                        + '</span>';
                }
            },
            function (el, options) {
                var o = createDom(), els;

                o.innerHTML = '<input type="hidden" name="'+ (options.beginname ? options.beginname : 'beginDate') +'" />'
                    + '<input type="hidden" name="'+ (options.endname ? options.endname : 'endDate') +'" />';
                
                if (options.bdate) {
                    els = options.bdate.split('-');
                    this._oBegin = new Date (els[0], parseInt(els[1], 10) - 1, els[2]);
                }
                if (options.edate) {
                    els = options.edate.split('-');
                    this._oEnd = new Date (els[0], parseInt(els[1], 10) - 1, els[2]);
                }
                els = children(o);    
                this._eBeginInput = els[0];
                this._eEndInput = els[1];

                moveElements(o, el, true);
            }
        );

    var UI_MULTI_CALENDAR_CLASS = UI_MULTI_CALENDAR.prototype;

    var UI_MULTI_CALENDAR_PANEL = UI_MULTI_CALENDAR_CLASS.Panel = 
        inheritsControl(
            UI_CONTROL,
            'ui-multi-calendar-panel',
            function () {},
            function (el, options) {
                var type = this.getTypes()[0],
                    html = [], range = options.range || {};

                this._oRange = range;
                html.push('<div class="'+ type +'-cal-area"><div class="'+ type +'-text"><strong>起始时间：</strong><span></span></div><div class="'+ UI_CALENDAR_PANEL.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-cal-area"><div class="'+ type +'-text"><strong>结束时间：</strong><span></span></div><div class="'+ UI_CALENDAR_PANEL.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-buttons"><div class="ui-button-g'+ UI_BUTTON.TYPES +'">确定</div><div class="'+ UI_BUTTON.TYPES +'">取消</div></div>');

                el.innerHTML = html.join('');
                el = children(el);

                this._eBeginText = el[0].firstChild.lastChild;
                this._eEndText = el[1].firstChild.lastChild;
                this._uBeginCal = $fastCreate(this.Cal, el[0].lastChild, this, {range: range});
                this._uBeginCal._sType = 'begin';
                this._uEndCal = $fastCreate(this.Cal, el[1].lastChild, this, {range: range});
                this._uEndCal._sType = 'end';
                this._uSubmitBtn = $fastCreate(this.Button, el[2].firstChild, this);
                this._uSubmitBtn._sType = 'submit';
                this._uCancelBtn = $fastCreate(this.Button, el[2].lastChild, this);
                this._uCancelBtn._sType = 'cancel';
            }
        );

    var UI_MULTI_CALENDAR_CANCEL_CLASS = 
        (UI_MULTI_CALENDAR_CLASS.Cancel = 
            inheritsControl(UI_CALENDAR_CLASS.Cancel)
        ).prototype;

    var UI_MULTI_CALENDAR_PANEL_CLASS = UI_MULTI_CALENDAR_PANEL.prototype;

    var UI_MULTI_CALENDAR_PANEL_CAL_CLASS = (
        UI_MULTI_CALENDAR_PANEL_CLASS.Cal = 
            inheritsControl(UI_CALENDAR_PANEL)
        ).prototype;

    var UI_MULTI_CALENDAR_PANEL_BUTTON_CLASS = 
        (UI_MULTI_CALENDAR_PANEL_CLASS.Button = 
            inheritsControl(UI_BUTTON)
        ).prototype;
    
    function UI_MULTI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.hide();
            if (con._bTip) {
                el.innerHTML = UI_MULTI_CALENDAR_STR_DEFAULT;
            }
        }
        else {
            con._uCancel.show();
        }
    };

    UI_MULTI_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate({begin: this._oBegin, end: this._oEnd});
        this._uPanel.init();
    };

    UI_MULTI_CALENDAR_CLASS.setDate = function (date) {
        var str = [], beginTxt, endTxt;

        if (date == null) {
            date = {begin: null, end: null};
        }

        beginTxt = date.begin ? formatDate(date.begin, UI_CALENDAR_STR_PATTERN) : '';
        endTxt = date.end ? formatDate(date.end, UI_CALENDAR_STR_PATTERN) : '';

        this._oBegin = date.begin;    
        this._oEnd = date.end;
        this._eBeginInput.value = beginTxt;
        this._eEndInput.value = endTxt;
        this._eInput.value = beginTxt + ',' + endTxt;
        if (this._oBegin) {
            str.push(beginTxt);
        }
        if (this._oEnd) {
            str.push(endTxt);
        }
        if (str.length == 1) {
            str.push(this._oEnd ? '之前' : '之后');
            str = str.join('');
        }
        else if (str.length == 2) {
            str = str.join('至');
        }
        else {
            str = '';
        }
        this._eText.innerHTML = str;
        UI_MULTI_CALENDAR_TEXT_FLUSH(this);
    };

    UI_MULTI_CALENDAR_CLASS.getDate = function () {
        return {begin: this._oBegin, end: this._oEnd};
    };

    /**
     * @event
     * 点击输入框右侧的取消按钮时触发
     */
    UI_MULTI_CALENDAR_CANCEL_CLASS.$click = function() {
        var par = this.getParent();
        UI_CALENDAR_CANCEL_CLASS.$click.call(this);
        par.clearRange();
    };

    /**
     * 清除日历面板的range限制
     * @public
     */
    UI_MULTI_CALENDAR_CLASS.clearRange = function() {
        this._uPanel._oRange.begin = null;
        this._uPanel._oRange.end = null;
        this._uPanel._uBeginCal.setRange(null, null);
        this._uPanel._uEndCal.setRange(null, null);
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.setDate = function (date) {
        var range = this._oRange, 
            begin, end;

        this._oBeginDate = date.begin;
        this._oEndDate = date.end;

        if (date.begin) {
            this._eBeginText.innerHTML = formatDate(date.begin, UI_CALENDAR_STR_PATTERN);
        }
        else {
            this._eBeginText.innerHTML = '';
        }

        if (date.end) {
            this._eEndText.innerHTML = formatDate(date.end, UI_CALENDAR_STR_PATTERN);
        }
        else {
            this._eEndText.innerHTML = '';
        }

        end = range.end ? range.end : date.end;
        if (range.end && date.end && date.end.getTime() < range.end.getTime()) {
                end =  date.end;
        }
        this._uBeginCal.setRange(range.begin, end, true);
        this._uBeginCal.setDate(date.begin);

        begin = range.begin ? range.begin : date.begin;
        if (range.begin && date.begin && date.begin.getTime() > range.begin.getTime()) {
                begin =  date.begin;
        }
        this._uEndCal.setRange(begin, range.end, true);
        this._uEndCal.setDate(date.end);
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
        this.hide();
    };

    /**
     * 隐藏日历面板，隐藏时需要调整range
     * @override
     */
    UI_MULTI_CALENDAR_PANEL_CLASS.hide = function (){
        UI_CONTROL_CLASS.hide.call(this);
        var par = this.getParent();
        var date = par.getDate();

        if (par._nYearRange) {
            if (date.end) {
                this._oRange.begin = new Date(date.end);
                this._oRange.begin.setFullYear(
                    this._oRange.begin.getFullYear() - par._nYearRange
                );
            }
            if (date.begin) {
                this._oRange.end = new Date(date.begin);
                this._oRange.end.setFullYear(
                    this._oRange.end.getFullYear() + par._nYearRange
                );
            }
        }
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uBeginCal.init();
        this._uEndCal.init();
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$change = function () {
        var par = this.getParent(),
            beginDate = this._oBeginDate,
            endDate = this._oEndDate;

        if (triggerEvent(par, 'change', [beginDate, endDate])) {
            par.setDate({begin: beginDate, end: endDate});
        }
        this.hide();
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$setDate = function (date, type) {
        var key = type.charAt(0).toUpperCase() 
                + type.substring(1);

        var par = this.getParent();

        this['_e' + key + 'Text'].innerHTML = formatDate(date, UI_CALENDAR_STR_PATTERN);
        this['_o' + key + 'Date'] = date;
        if (type == 'begin') {
            if (par._nYearRange) {
                this._oRange.end = new Date(date);
                this._oRange.end.setFullYear(this._oRange.end.getFullYear() + par._nYearRange);
            }
            this._uEndCal.setRange(date, this._oRange.end);
        }
        else {
            if (par._nYearRange) {
                this._oRange.begin = new Date(date);
                this._oRange.begin.setFullYear(this._oRange.begin.getFullYear() - par._nYearRange);
            }
            this._uBeginCal.setRange(this._oRange.begin, date);
        }
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.$change = function (event, date) {
        var par = this.getParent();

        this._oDateSel = date;
        par.$setDate(date, this._sType);
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.setRange = function (begin, end, isSilent) {
        this._uMonthView.setRange(begin, end, isSilent);
    };

    UI_MULTI_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var par = this.getParent();
        UI_BUTTON_CLASS.$click.call(this);
        if (this._sType == 'submit') {
            triggerEvent(par, 'change');
        }
        else {
            par.hide();
        }
    };
})();

﻿(function () {
    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        ext = core.ext,
        util = core.util,

        $create = core.$create,
        $fastCreate = core.$fastCreate,
        children = dom.children,
        getPosition = dom.getPosition,
        createDom = dom.create,
        moveElements = dom.moveElements,
        trim = string.trim,
        encodeHTML = string.encodeHTML,
        decodeHTML = string.decodeHTML,
        getView = util.getView,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT = ui.Input,
        UI_INPUT_CLASS = UI_INPUT.prototype,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype;


    var UI_TABLE_EDITOR = ui.TableEditor = 
        inheritsControl(
            UI_CONTROL,
            'ui-table-editor',
            function (el, options) {
                var html = null;
                if (options.type != 'url') {
                    html = '<div class="ui-' + options.type + '"></div>';
                }
                else {
                    html = [
                            '<div class="ui-select" style="width:62px">',
                            '</div>',
                            '<div class="ui-input" style="margin-left:1px"></div>',
                            '<div class="ui-input" style="width:60px;margin-left:1px"></div>'
                            ].join('');
                }
                el.innerHTML = html;
            },
            function (el, options) {
                var me = this;
                var childs = children(el);
                if (options.type == 'input') {
                    me._uInput = $fastCreate(UI_INPUT, childs[0], this, {});

                }
                else if (options.type == 'select') {
                    me._uSelect = $fastCreate(UI_SELECT, childs[0], this, {});

                }
                else if (options.type == 'url') {
                    me._uFront = $fastCreate(UI_SELECT, childs[0], this, {});
                    me._uFront.setSize(62, 22);
                    me._uRoot = $fastCreate(UI_INPUT, childs[1], this, {});
                    me._uRoot.setSize(100, 22);

                    me._uPath = $fastCreate(UI_INPUT, childs[2], this, {});
                    me._uPath.setSize(60, 22);

                }

                if (options.type == 'select' || options.type == 'input') {
                    
                    var control = me._uInput || me._uSelect;
                    function triggerConnectEvent(control, rowData) {
                        triggerEvent(control, 'change', null, [control.getInnerControl(), control.target && control.target.getInnerControl(), rowData]);
                        if(control.target) {
                            triggerConnectEvent(control.target);
                        }
                    }

                    control.onchange = function() {
                        var rowData = me.rowData;
                        triggerConnectEvent(me, rowData);
                    }
                }
                else {
                    me._uFront.onchange = me._uRoot.onchange = me._uPath.onchange = function () {
                        var rowData = me.rowData;
                        triggerEvent(me, 'change', null, [me._uFront, me._uRoot, me._uPath, rowData]);
                    }
                }
            }
        )
    
    UI_TABLE_EDITOR_CLASS = UI_TABLE_EDITOR.prototype;

    UI_TABLE_EDITOR_CLASS.setValue = function(value) {
        var control = this._uInput || this._uSelect;
        control.setValue(value);
    }

    UI_TABLE_EDITOR_CLASS.getValue = function() {
        var control = this._uInput || this._uSelect;
        var value = null;
        if (!control) {
            var fronts = {
                '1' : 'www',
                '2' : '无前缀'
            }
            var front =  this._uFront.getValue();  
            front = fronts[front];
            var root =  this._uRoot.getValue();  
            var path =  this._uPath.getValue();  
            value = front + root + path;
        }
        else {
            value = control.getValue();
        }
        return value;
    }

    UI_TABLE_EDITOR_CLASS.getInnerControl = function() {
        var me = this;
        var control = this._uInput || this._uSelect;
        if (!control) {
            control = [
                me._uFront,
                me._uRoot,
                me._uPath
            ];
        }
        return control;
    }

    UI_TABLE_EDITOR_CLASS.show = function (con) {
        var me = this;

        var con = con || me.showCell;
        var pos = getPosition(con),
            view = getView(),
            left = pos.left, top = pos.top;
        var ele = this.getOuter();
        var rowData = this.rowData;
        //this.setValue(value);
        UI_CONTROL_CLASS.show.call(this);
        this.resize();
        if (left + this.getWidth() > view.right) {
            left = view.right - this.getWidth();
        }
        if (top + this.getHeight() > view.bottom) {
            top = view.bottom - this.getHeight();
        }
        this.setPosition(0, 0);
        con.appendChild(this.getOuter());
        //set outer width and height
        ele.style.width = con.offsetWidth - 2 + 'px';
        ele.style.height =  con.offsetHeight - 5 + 'px';

        //select control
        if(this._uSelect) {
            this._uSelect.setSize(con.offsetWidth - 2, 22);
        }
        else if(this._uInput) {
            this._uInput.setValue('');
            this._uInput.getOuter().style.width = (con.offsetWidth - 2) + 'px';
        }
        else {
            me._uFront.setSelectedIndex(0);
            me._uRoot.setValue('');
            me._uPath.setValue('');
            var frontWidth = me._uFront.getOuter().offsetWidth;
            var rootWidth = me._uRoot.getOuter().offsetWidth;   
            me._uRoot.getOuter().style.width = (con.offsetWidth - 130) + 'px';
            
            var pathWidth = me._uPath.getOuter().offsetWidth;     
            ele.style.width = frontWidth + rootWidth + pathWidth + 9 + 'px';
        }

        //set focus
        this.focus();
        if (Object.prototype.toString.call(this.getInnerControl()) !== '[object Array]') {
            triggerEvent(this, 'beforeedit', null, [this.getInnerControl(), rowData]);
        }
        else {
            var args = this.getInnerControl();
            args.push(rowData);
            triggerEvent(this, 'beforeedit', null, args);
        }
    }


    var lazyCheck = function() {
        var focused = ecui.getFocused();
        var focusedEditor = null;

        if ((focused instanceof UI_ITEM) && (focused.getParent() instanceof UI_SELECT)) {
            focused = focused.getParent();
        }

        if ((focused instanceof UI_SELECT) && (focused.getParent() instanceof UI_TABLE_EDITOR)) {
            focused = focused.getParent();
        }

        if (focused instanceof UI_TABLE_EDITOR) {
            focusedEditor = focused;
        }


        var checkIsTagetFocus = function(control) {
            var flag = false;
            if (control == focusedEditor) {
                flag = true;
            }
            else if (control.target) {
                flag = checkIsTagetFocus(control.target);
            }
            return flag;
        }

        var checkIsParentFocus = function(control) {
            var flag = false;
            if (control == focusedEditor) {
                flag = true;
            }
            else if (control.parTarget) {
                flag = checkIsParentFocus(control.parTarget);
            }
            return flag;
        }
        var connectControls = [];
        var getParControls = function(control) {
            connectControls.push(control);
            if (control.target && baidu.array.indexOf(connectControls, control.target)) {
                getParControls(control.target);
            }
        }

        var getChildControls = function(control) {
            connectControls.push(control);
            if (control.parTarget && baidu.array.indexOf(connectControls, control.parTarget)) {
                getChildControls(control.parTarget);
            }
        }

        if (!focusedEditor || (!checkIsTagetFocus(this) && !checkIsParentFocus(this))) {
            
            getParControls(this);
            getChildControls(this);
            connectControls = baidu.array.unique(connectControls);
            baidu.each(connectControls, function(item) {
                item.hide();
            });
        }
    }

    UI_TABLE_EDITOR_CLASS.$blur = function (event) {
        var me = this;
        setTimeout(function(){
            lazyCheck.call(me, event)
        }, 1); 
    } 

    UI_TABLE_EDITOR_CLASS.onhide = function (e) {
        var me = this;
        
        var rowData = this.rowData;
        var table = this.getParent();
        var control = this._uInput || this._uSelect;
        var me = this;
        var editCell = this.editCell;
        document.body.appendChild(me.getOuter());
        var e = {
            'message' : ''
        }
        var o = null; 

        if (!control) {
            o = triggerEvent(this, 'editsubmit', e, [me._uFront, me._uRoot, me._uPath, rowData]);
        }
        else {
            o = triggerEvent(this, 'editsubmit', e, [control, rowData]);
        }
        
        if ('[object String]' == Object.prototype.toString.call(e.message) && e.message != '') {
            this.setError(e.message);
        }
        else {
            if (control && control ==  this._uInput) {
                e.value = (e.value !== undefined ? e.value : control.getValue());
                editCell.innerHTML = e.value;
            }
            else if (control && control ==  this._uSelect) {
                editCell.innerHTML = control.getSelected()._eBody.innerText;
            }
            else {
                e.value = (e.value !== undefined ? e.value : me.getValue());
                editCell.innerHTML = e.value;
            }
        }

    }

    UI_TABLE_EDITOR_CLASS.focus = function () {
        var control = this._uInput || this._uSelect;
        core.setFocused(this, control);
    }


    UI_TABLE_EDITOR_CLASS.setAttached = function(cell, data) {

        var container = baidu.dom.children(cell)[1];
        var table = this.getParent();

        var control = this._uSelect;
        var editCell = table._sEditCell;

        var nowText = container.innerHTML;
        control.clear();
        var nowValue = undefined;
        baidu.each(data, function(item) {
            if (nowText == item.text) {
                nowValue = item.value;
            }
            control.add(item.text, null, {'value' : item.value});
        });
        control.setValue(nowValue);
    }

    UI_TABLE_EDITOR_CLASS.setError = function (str) {
        str = trim(str);
        var table = this.getParent();
        var editCell = table._sEditCell;

        if(str) {
            ecui.alert(str, function() {});
        }
    }
})();

/**
 * custom-table.js
 * Copyright 2012 Baidu Inc. All rights reserved *
 * desc: 工作台项目定制的table控件，提供的功能包括表头锁定和列锁定、行选中、排序、使用render方法填充和刷新表格；表格支持跨行跨列,最多跨两行
 * author: hades(denghongqi@baidu.com)
 */

 (function () {
    var core = ecui,
        dom = core.dom,
        array = core.array,
        ui = core.ui,
        string = core.string,
        util = core.util,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        disposeControl = core.dispose,
        $disposeControl = core.$dispose,
        createDom = dom.create,
        first = dom.first,
        last = dom.last,
        children = dom.children,
        addClass = dom.addClass,
        setStyle = dom.setStyle,
        setText = dom.setText,
        getText = dom.getText,
        removeClass = dom.removeClass,
        getParent = dom.getParent,
        moveElements = dom.moveElements,
        getAttribute = dom.getAttribute,
        getPosition = dom.getPosition,
        encodeHTML = baidu.string.encodeHTML,
        remove = array.remove,
        getView = util.getView,
        extend = util.extend,
        repaint = core.repaint,
        attachEvent = util.attachEvent,
        detachEvent = util.detachEvent,

        chromeVersion = /chrome\/(\d+\.\d+)/i.test(navigator.userAgent) ? + RegExp['\x241'] : undefined,
        MATH = Math,
        MIN = MATH.min,
        WINDOW = window,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_TABLE = ui.Table,
        UI_TABLE_CLASS = UI_TABLE.prototype,
        UI_LOCKED_TABLE = ui.LockedTable,
        UI_LOCKED_TABLE_CLASS = UI_LOCKED_TABLE.prototype,
        UI_TABLE_EDITOR = ui.TableEditor,
        UI_TABLE_EDITOR_CLASS = UI_TABLE_EDITOR.prototype;

    var UI_CUSTOM_TABLE = ui.CustomTable =
        inheritsControl(
            UI_LOCKED_TABLE,
            'ui-table',
            function(el, options) {
                this._oOptions = options;
                this._aHeader = options.header;
                this._sSortby = options.sortby;
                this._sOrderby = options.orderby;
                this.editors = {};

                if (!options.datasource) {
                    this._nLeftLock = options.leftLock || 0;
                    this._nRightLock = options.rightLock || 0;
                }

                var type = this.getTypes()[0];

                var html = [];
                html.push('<table><thead>');

                options.leftLock = options.leftLock || 0;
                options.rightLock = options.rightLock || 0;
                var lockedTotal = options.leftLock + options.rightLock;

                if (!options.datasource) {
                    setStyle(el, 'width', '100%');
                }
                else {
                    setStyle(el, 'width', 'auto');
                    setStyle(el, 'display', 'block');
                }

                if (!options.datasource) {
                    html.push('<tr>');
                    var i;
                    for (var i = 0; i <= lockedTotal; i++) {
                        html.push('<th></th>');
                    }
                    html.push('</tr>');
                }
                else {
                    //表头目前只支持跨两行
                    if ('[object Array]' == Object.prototype.toString.call(options.fields[0])) {
                        var flag = 0;    
                        var i;
                        for (i = 0; i < options.fields.length; i++) {
                            var o = options.fields[i];
                            html.push(createHeadRow(o, this, options.fields));
                        }
                        this._aColumns = [];
                        for (var i = 0, o; o = options.fields[0][i]; i++) {
                            if (o.colspan) {
                                for (var j = 0; j < o.colspan; j++) {
                                    this._aColumns.push(extend({}, options.fields[1][flag++]));
                                }
                            }
                            else {
                                this._aColumns.push(extend({}, o));
                            }
                        }
                    }
                    else {
                        html.push(createHeadRow(options.fields, this));
                        this._aColumns = copyArray(options.fields);
                    }
                }

                html.push('</thead><tbody>');

                if(!options.datasource)  {
                    html.push('<tr>');
                    var i;
                    html.push('<td></td>');
                    html.push('</tr>');
                    options.leftLock = 0;
                    options.rightLock = 0;
                }
                else {
                    this._aData = options.datasource;

                    if (!this._aData.length) {
                        html.push('<tr>');
                        html.push(
                            '<td class="' + type + '-empty-cell'
                            + '" align="left" colspan="'
                            + this._aColumns.length
                            + '">'
                        );
                        html.push(
                            options.errorMsg 
                            ? options.errorMsg
                            : '暂无数据，请稍后再试'
                        );
                        html.push('</td>');
                        html.push('</tr>');
                    }
                    else {
                        var i;
                        for (i = 0; i < options.datasource.length; i++) {
                            var item = options.datasource[i];
                            html.push('<tr>');
                            var j;
                            for (j = 0; j < this._aColumns.length; j++) {
                                var o = this._aColumns[j];
                                html.push('<td');

                                if (o.checkbox) {
                                    o.width = 16;
                                }

                                html.push(' width="' + o.width + '"');
                                html.push(
                                    ' style="width:' 
                                    + o.width 
                                    + 'px;'
                                    + 'min-width:'
                                    + o.width
                                    + 'px;'
                                    + 'max-width:'
                                    + o.width
                                    + 'px;"'
                                );
                                html.push(' class="');

                                if (options.autoEllipsis) {
                                    html.push(type + '-cell-ellipsis ');
                                }

                                if (o.editable) {
                                    html.push(type + '-cell-editable ');
                                }

                                if(o.align) {
                                    html.push(type + '-cell-align-' + o.align + ' ');
                                }

                                html.push('"');

                                o.editable && o.field && html.push(
                                    ' edit-field="' + o.field + '"'
                                ) 
                                && html.push(
                                    ' edit-type="' + o.editType + '"'
                                ) && o.target && html.push(
                                    ' edit-target="' + o.target + '"'
                                );

                                o.align && html.push(
                                    ' align="' + o.align + '"'
                                );

                                html.push('>');

                                if (o.editable) {
                                    html.push('<div class="' + type + '-cell-editor-container">');
                                    html.push('<span class="' + type + '-cell-editor-button"></span>');
                                }   
                                
                                var content = o.content || o.field;

                                if (typeof content == 'function') {
                                    if (o.checkbox) {
                                        html.push('<input type="checkbox"');
                                        html.push(
                                            ' class="' + type + '-checkbox"'
                                        );
                                        html.push(
                                            ' data-rownum="' + i + '"'
                                        );
                                        html.push(' />');
                                    }
                                    else {
                                        var e = content.call(null, item, i);
                                        if (Object.prototype.toString.call(e) == '[object String]') {
                                            if (options.autoEllipsis) {
                                                html.push(
                                                    '<div style="overflow:hidden; text-overflow:ellipsis;'
                                                    + 'width:' + o.width + 'px;'
                                                    + 'max-width:' + o.width + 'px;'
                                                    + 'min-width:' + o.width + 'px;'
                                                    + '" title="'
                                                    + e
                                                    + '">'
                                                    + e
                                                    + '</div>'
                                                );
                                            }
                                            else if (o.maxlength 
                                                && e
                                                && e.length > o.maxlength
                                            ) {
                                                html.push('<span class="');
                                                html.push(type + '-cell-limited"');
                                                html.push(' title="' + e + '">');
                                                html.push(encodeHTML(e.substring(0, o.maxlength)));
                                                html.push('...');
                                                html.push('</span>');
                                            }
                                            else if (o.editable) {
                                                html.push('<div>' + e + '</div>');
                                                html.push('</div>');
                                            }
                                            else {
                                                html.push(e);
                                            }
                                        }
                                        else {
                                            var div = createDom();
                                            div.appendChild(e);
                                            html.push(div.innerHTML);
                                        }
                                    }
 
                                }
                                else {
                                    if (o.detail) {
                                        html.push(
                                            '<span style="margin-left:3px;margin-top:7px;float:right"'
                                            + ' ecui="type:tip;asyn:true;id:'
                                        );
                                        html.push('tip-' + item[o.idField] + '"');
                                        html.push('></span>');
                                    }

                                    if (o.checkbox) {
                                        html.push('<input type="checkbox"');
                                        html.push(
                                            ' class="' + type + '-checkbox"'
                                        );
                                        html.push(
                                            ' data-rownum="' + i + '"'
                                        );
                                        html.push(' />');
                                    }
                                    else if (o.score) {
                                        html.push('<span ecui="type:score; static:true; max:');
                                        html.push(
                                            o.max + '; value:' + item[content]
                                        );
                                        html.push('"></span>');
                                    }
                                    else {
                                        if (options.autoEllipsis) {
                                            html.push(
                                                '<div style="overflow:hidden; text-overflow:ellipsis;'
                                                + 'width:' + o.width + 'px;'
                                                + 'max-width:' + o.width + 'px;'
                                                + 'min-width:' + o.width + 'px;'
                                                + '" title="'
                                                + encodeHTML(item[content])
                                                + '">'
                                                + encodeHTML(item[content])
                                                + '</div>'
                                            );
                                        }
                                        else if (o.maxlength 
                                            && item[content] 
                                            && item[content].length > o.maxlength
                                        ) {
                                            html.push('<span class="');
                                            html.push(type + '-cell-limited"');
                                            html.push(' title="' + encodeHTML(item[content]) + '">');
                                            html.push(encodeHTML(item[content].substring(0, o.maxlength)));
                                            html.push('...');
                                            html.push('</span>');
                                        }
                                        else if (o.editable) {
                                            item[content] = item[content] || '';
                                            html.push('<div>' + encodeHTML(item[content]) + '</div>');
                                            html.push('</div>');
                                        }
                                        else {
                                            item[content] = item[content] || '';
                                            html.push(encodeHTML(item[content]));
                                        }
                                    }
                                }

                                html.push('</td>');
                            }
                            html.push('</tr>');
                        }
                    }
                }

                html.push('</tbody></table>');

                el.innerHTML = html.join('');

                return el;
            },
            function(el, options) {
                ecui.init(el);
                if (options.fields && options.datasource) {
                    initEmbedControlEvent(options.fields, options.datasource);
                }

                this.$bindCheckbox();
                return el;
            }
        ),
        UI_CUSTOM_TABLE_CLASS = UI_CUSTOM_TABLE.prototype,

        DELEGATE_EVENTS = ['click', 'mouseup', 'mousedown'],

        // 默认处理函数
        DEFAULT_EVENTS = {
            
            'click th.ui-table-hcell-sort': function (event, control) {
                var field = this.getAttribute('data-field'),
                    orderby;

                if (this.className.indexOf('-sort-desc') >= 0) {
                    orderby = 'asc';
                }
                else if (this.className.indexOf('-sort-asc') >= 0) {
                    orderby = 'desc'
                }
                else {
                    orderby = this.getAttribute('data-orderby') || 'desc';
                }

                triggerEvent(control, 'sort', null, [field, orderby]);
            },
            'click input.ui-table-checkbox-all': function (event, control) {
                control.$refreshCheckbox(this.checked);
            },
            'click input.ui-table-checkbox': function (event, control) {
                control.$refreshCheckbox();
            },
            'click span.ui-table-cell-editor-button': function (event, table) {
                var evt = event || window.event;
                var icon = baidu.event.getTarget(evt);
                var cellCon = baidu.dom.next(icon);
                var content = cellCon.innerHTML;
                var cellCon = baidu.dom.getParent(icon);
                var cell = baidu.dom.getParent(cellCon);

                var editField = baidu.dom.getAttr(cell, 'edit-field');
                var editType = baidu.dom.getAttr(cell, 'edit-type');
                

                var datasource = table._oOptions.datasource;
                var rows = table._aRows;
                var nowRow = ecui.findControl(cell).getParent();
                var rowIndex = baidu.array.indexOf(rows, nowRow);
                var rowData = datasource[rowIndex];

                var fieldCells = {};
                baidu.each(nowRow._aElements, function(ele) {
                    var o = baidu.dom.getAttr(ele, 'edit-field');
                    if(o) {
                        fieldCells[o] = ele;
                    }
                });

                table._sEditors = table._sEditors || [];

                /**
                 * 创建Editor
                 * @param  {[type]} editField [description]
                 * @return {[type]}           [description]
                 */
                function createEditor (editField) {
                    var editor = table._sEditors[editField];
                    var editTarget = baidu.dom.getAttr(fieldCells[editField], 'edit-target');
                    if(!editor) {
                        var editorCon = baidu.dom.create('div', {
                            'class' : 'ui-table-editor'
                        });
                        document.body.appendChild(editorCon);
                        editor = $fastCreate(UI_TABLE_EDITOR, editorCon, table, {'type' : editType, 'target' : null});
                        table._sEditors[editField] = editor;

                        //创建的时候就创建事件
                        var editorHandles = table.editors[editField];
                        for (var handle in editorHandles) {
                            editor[handle] = editorHandles[handle];
                        }
                    }
                    editor.rowData = rowData;
                    //如果关联控件 创建关联控件
                    if(editTarget) {
                        var tarEditor = createEditor(editTarget);

                        editor.target = tarEditor;
                        editor.targetField = editTarget;
                        
                        tarEditor.parTarget = editor;
                    }

                    return editor;
                }

                var editor = createEditor(editField);

                table._showEditors = [];
                function showControl(editor, editField) {

                    var cell = fieldCells[editField];

                    editor.show(children(cell)[0]);
                    editor.editCell = children(cellCon)[1];
                    editor.showCell =  children(cell)[0];
                    table._showEditors.push(editor);
                    if(editor.target) {
                        showControl(editor.target, editor.targetField);
                    }
                }

                showControl(editor, editField);


            }
        };

    /** 
     * 生成表头的一行
     * 
     * @param {Array} headrow 一行表头的数据
     * @param {ecui.ui.CustomTable} con
     * @param {Array} opt_head 所有的表头数据
     * @return {string} html片段
     */
    function createHeadRow(headrow, con, opt_head) {
        var type = con.getTypes()[0];

        var html = [];
        html.push('<tr>');

        var flag = 0;
        var i = 0;
        for (i = 0; i < headrow.length; i++) {
            var o = headrow[i];
            html.push('<th ');
            html.push('data-field="');

            if (Object.prototype.toString.call(o.field) == '[object String]') {
                html.push(o.field);
            }

            if (o.width) {
                html.push(
                    '" style="width:' + o.width + 'px;'
                    + 'min-width:' + o.width + 'px;'
                    + 'max-width:' + o.width + 'px;'
                );
            }

            if (o.editable && o.field) {
                con.editors[o.field] = con.editors[o.field] || {};
            }
            
            if (o.rowspan) {
                html.push(
                    '" rowspan="' + o.rowspan
                );
            }
            if (o.colspan) {
                html.push(
                    '" colspan="' + o.colspan
                );

                var j;
                var width = 0;
                for (j = flag; j < flag + o.colspan; j++) {
                    width += opt_head[1][j].width;
                }

                html.push(
                    '" width="' + width
                );

                flag += o.colspan;
            }
            if (o.sortable) {
                html.push(
                    '" class="' + type + '-hcell-sort'
                );
                if (o.field && o.field == con._sSortby) {
                    html.push(
                        ' ' + type + '-hcell-sort-' + con._sOrderby
                    );
                }

                if (o.order) {
                    html.push(
                        '" data-orderby="' + o.order.toLowerCase()
                    );
                }
            }

            html.push('">');
            
            if (o.name) {
                html.push(o.name);
            }

            if (o.checkbox) {
                html.push(
                    '<input type="checkbox" class="'
                    + type + '-checkbox-all"'
                    + ' />'
                );
            }

            if (o.tip && o.tip.length) {
                html.push('<span ecui="type:tip; id:tip-');
                html.push(o.field);
                html.push('; message:');
                html.push(o.tip);
                html.push('"></span>');
            }

            html.push('</th>');
        }
        html.push('</tr>');

        return html.join('');
    }

    /**
     * 帮顶表格内部子控件的事件
     *
     * @param {Array} header 表头数据
     * @param {Array} datasource 表格数据
     */
    function initEmbedControlEvent(header, datasource) {
        var i = 0;
        for (i = 0; i < datasource.length; i++) {
            var item = datasource[i];
            for (var j = 0; j < header.length; j++) {
                var o = header[j];
                if (o.detail) {
                    var controlId = 'tip-' + item[o.idField];
                    if (ecui.get(controlId)) {
                        ecui.get(controlId).onloadData = (function (item, o) {
                            return function (handler) {
                                o.loadData(item, handler);
                            }
                        }) (item, o);
                    }
                }
            }
        }
    }

    UI_CUSTOM_TABLE_CLASS.getData = function () {
        return this._aData;
    };

    /**
     * 重新生成表格
     * @public
     *
     * @param {Array} fields 表格的列配置
     * @param {Array} datasource 表格数据
     * @param {Object} sortinfo 排序信息
     * @param {Object} options 初始化选项
     * @param {string} errorMsg 表格为空或出错时展示的内容
     */
    UI_CUSTOM_TABLE_CLASS.render = function(
        fields, datasource, sortinfo, options, errorMsg
    ) {
        var options = extend({}, options);
        options = extend(options, this._oOptions);
        options.leftLock = this._nLeftLock;
        options.rightLock = this._nRightLock;
        options.fields = fields;
        options.datasource = datasource || [];
        var sortinfo = sortinfo || {};
        options.sortby = sortinfo.sortby;
        options.orderby = sortinfo.orderby;
        options.errorMsg = errorMsg;

        if (!datasource.length) {
            options.leftLock = 0;
            options.rightLock = 0;
        }

        detachEvent(WINDOW, 'resize', repaint);

        if (!options.complex) {
            var key;

            //卸载行
            var rows;
            var i;
            rows = this._aHeadRows.concat(
                this._aRows, 
                this._aLockedRow, 
                this._aLockedHeadRow
            );

            var row;
            for (i = 0; row = rows[i]; i++) {
                var j;
                if (row._aElements) {
                    var cells = row.getCells();
                    for (j = 0; cell = cells[j]; j++) {
                        $disposeControl(cell);
                    }
                    $disposeControl(row, true);
                }
            }
        }

        for (i = 0; key = this._aHCells[i]; i++) {
            $disposeControl(key, true);
        }

        //卸载内部子控件
        for (key in this) {
            if (/_u\w+/.test(key)) {
                disposeControl(this[key]);
            }
        }

        var el = this.getOuter();
        el.innerHTML = '';
        this.$setBody(el);

        this.$resize();
        UI_CUSTOM_TABLE.client.call(this, el, options);
        this._bCreated = false;
        this.cache(true, true);
        //this.init();
        UI_LOCKED_TABLE_CLASS.init.call(this);

        //恢复
        attachEvent(WINDOW, 'resize', repaint);
        this.resize();
    };

    UI_CUSTOM_TABLE_CLASS.disposeUnit = function(callback) {
        detachEvent(WINDOW, 'resize', repaint);

        var key;

        //卸载行
        var rows;
        rows = this._aHeadRows.concat(
            this._aRows, 
            this._aLockedRow, 
            this._aLockedHeadRow
        );

        var i = 0;
        var timer = function() {
            var row = rows[i];
            if (row) {
                var j;
                if (row._aElements) {
                    var cells = row.getCells();
                    for (j = 0; cell = cells[j]; j++) {
                        $disposeControl(cell);
                    }
                    $disposeControl(row, true);
                }
                i++;
                setTimeout(timer, 0);
            }
            else {
                callback();
            }
        };
        timer();

        //恢复
        attachEvent(WINDOW, 'resize', repaint);
    };

    /**
     * 获取表格当前所有行单选框的引用
     * @private
     */
    UI_CUSTOM_TABLE_CLASS.$bindCheckbox = function () {
        var inputs = this.getBody().getElementsByTagName('input'),
            i, item, type = this.getTypes()[0];

        this._aCheckboxs = [];
        this._eCheckboxAll = null;

        for (i = 0; item = inputs[i]; i++) {
            if (item.type == 'checkbox' 
                    && item.className.indexOf(type + '-checkbox-all') >= 0
            ) {
                this._eCheckboxAll = item;
            }
            else if (item.type == 'checkbox' && item.className.indexOf(type + '-checkbox') >= 0) {
                this._aCheckboxs.push(item);
            }
        }
    };

    /**
     * 刷新表格的行单选框
     * @private
     *
     * @param {Boolean} checked 全选/全不选 如果忽略此参数则根据当前表格的实际选择情况来设置“全选”的勾选状态
     */
    UI_CUSTOM_TABLE_CLASS.$refreshCheckbox = function (checked) {
        var i, item, newChecked = true, tr;

        for (i = 0; item = this._aCheckboxs[i]; i++) {
            tr = item.parentNode.parentNode;
            if (checked !== undefined) {
                item.checked = checked;
            }
            else {
                newChecked = item.checked && newChecked;
            }

            if (item.checked && this._bCheckedHighlight) {
                tr.className += ' highlight';
            }
            else if (this._bCheckedHighlight) {
                tr.className = tr.className.replace(/\s+highlight/g, '');
            }
        }

        if (this._eCheckboxAll) {
            this._eCheckboxAll.checked = checked !== undefined ? checked : newChecked;
        }

        triggerEvent(this, 'checkboxChange');
    };

    /**
     * table生产完毕以后执行，触发sizechange事件
     *
     */
    UI_CUSTOM_TABLE_CLASS.$ready = function() {
        triggerEvent(this, 'sizechange');
    };


    /**
     * 浏览器resize时调整横滚的位置
     *
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.$resize = function() {
        var me = this;
        UI_LOCKED_TABLE_CLASS.$resize.call(this);
        setTimeout(
            function() {
                triggerEvent(me, 'sizechange');
                me.$pagescroll();
            },
            100
        );
    };

    /**
     * 页面滚动时保持表头和横滚浮在视窗上
     *
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.$pagescroll = function() {
        UI_LOCKED_TABLE_CLASS.$pagescroll.call(this);

        if (this._uHScrollbar) {
            setFloatHScroll(this);
        }
    };

    UI_CUSTOM_TABLE_CLASS.getSelection = function () {
        if (!this._aCheckboxs || !this._aCheckboxs.length) {
            return [];
        }

        var res = [];

        for (var i = 0, o; o = this._aCheckboxs[i++]; ) {
            if (o.checked) {
                var index = getAttribute(o, 'data-rownum') - 0;
                res.push(extend({}, this._aData[index]));
            }
        }
        return res;
    };

    /**
     * 根据行号选中行,行号从零开始
     *
     * @public
     * @param {Array} selection
     */
    UI_CUSTOM_TABLE_CLASS.setSelection = function(selection) {
        var selection = selection || [];
        for (var i = 0, len = this._aCheckboxs.length; i < len; i++) {
            if (array.indexOf(selection, i) >= 0) {
                this._aCheckboxs[i].checked = true;
            }
            else {
                this._aCheckboxs[i].checked = false;
            }
        }
        this.$refreshCheckbox();
    };

    /**
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.init = function () {
        var i, item, ele = this.getOuter(),
            control = this;

        UI_LOCKED_TABLE_CLASS.init.call(this);

        // 添加控件全局的事件监听
        // 只支持click mousedown mouseup
        for (i = 0; item = DELEGATE_EVENTS[i]; i++) {
            attachEvent(ele, item, (function (name) {
                return function (event) {
                    var e = event || window.event;
                    e.targetElement = e.target || e.srcElement;
                    control.$fireEventHandler(name, e);
                }
            })(item));
        }
    };

    /**
     * 触发表格events中定义的事件
     * @private
     *
     * @param {String} eventType 事件类型
     * @param {Event} nativeEvent 原生事件参数
     */
    UI_CUSTOM_TABLE_CLASS.$fireEventHandler = function (eventType, nativeEvent) {
        var events = getHandlerByType(this.events, eventType),
            i, item, target = nativeEvent.targetElement, selector;

        for (i = 0; item = events[i]; i++) {
            if (checkElementBySelector(target, item.selector)) {
                item.handler.call(target, nativeEvent, this);
            }
        }
    }

    UI_CUSTOM_TABLE_CLASS.$refresh = function (el, options) {
        var cells = [],
            rows = [];

        addClass(el, this.getTypes()[0]);

        cells = this._aHCells;
        rows = this._aRows.concat(this._aHeadRows, this._aLockedRow, this._aLockedHeadRow);

        for (var i = 0, o; o = cells[i++]; ) {
            disposeControl(o);
        }

        for (var i = 0, o; o = rows[i++]; ) {
            disposeControl(o);
        }

        //释放原表格中的部分引用
        //this._eCheckboxAll && delete this._eCheckboxAll;
        //this._aCheckboxs && delete this._aCheckboxs;

        UI_LOCKED_TABLE_CLASS.$refresh.call(this, el, options);

    };

    /**
     * 让表格的横滚始终悬浮在页面视窗低端
     * 
     * @param {ecui.ui.CustomTable} con
     */
    function setFloatHScroll(con) {
        var el;

        el = con._eBrowser ? con._eBrowser : con._uHScrollbar.getOuter();
        el.style.top = MIN(
            getView().bottom - getPosition(con.getOuter()).top - el.offsetHeight,
            con.getHeight() - el.offsetHeight
        ) + 'px';

        setStyle(el, 'zIndex', 1);
    }

    function getHandlerByType(events, type) {
        var handlers = [], item;

        events = extend({}, events);
        events = extend(events, DEFAULT_EVENTS);

        for (var key in events) {
            item = {handler: events[key]};
            key = key.split(/\s+/);
            if (key[0] == type) {
                item.selector = key[1];
                handlers.push(item);
            }
        }

        return handlers;
    }

    function checkElementBySelector(ele, selector) {
        var tagName, value, type, res = true;

        if (!ele && !selector) {
            return false;
        }

        selector.replace(/^([^.#]*)([.#]?)(.*)$/, function ($0, $1, $2, $3) {
            tagName = $1;
            type = $2;
            value = $3;
        });

        if (tagName && ele.tagName.toLowerCase() != tagName) {
            res = false;
        }

        if (type == '.' && !new RegExp('(^|\\s+)' + value + '(\\s+|$)').test(ele.className)) {
            res = false;
        }

        if (type == '#' && ele.id != value) {
            res = false;
        }

        return res;
    }
    
    function copyArray(data) {
        var res = [];
        for (var i = 0, o; o = data[i++]; ) {
            res.push(extend({}, o));
        }
        return res;
    }

 }) ();

/**
 * ext table
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    ext-table.js
 * desc:    增强表格，满足业务要求 
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/05
 * attention: 
 * 不支持表格Body中的数据进行单元格合并
 * 如果要支持，需要修改的函数有：
 * removeRow
 *
 * events:
 *      aftercollapserow
 *      afterexpendrow
 *      beforecollapserow
 *      beforeexpendrow
 */
(function () {
    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        util = core.util,
        string = core.string,
        ext = core.ext,

        MATH = Math,
        MAX = MATH.max,
        MIN = MATH.min,

        $fastCreate = core.$fastCreate,
        query = core.query,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        disposeControl = core.dispose,
        getScrollNarrow = core.getScrollNarrow,
        getView = util.getView,
        toNumber = util.toNumber,
        extend = util.extend,
        blank = util.blank,
        trim = string.trim,
        createDom = dom.create,
        moveElements = dom.moveElements,
        getPosition = dom.getPosition
        getParent = dom.getParent,
        insertBefore = dom.insertBefore,
        first = dom.first,
        children = dom.children,
        getStyle = dom.getStyle,
        indexOf = array.indexOf,

        UI_CONTROL = ui.Control,
        UI_TIP = ui.Tip,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_TABLE = ui.Table,
        UI_CHECKBOX = ui.Checkbox,
        UI_TABLE_CLASS = UI_TABLE.prototype,
        UI_TABLE_HCELL_CLASS = UI_TABLE_CLASS.HCell.prototype,
        UI_LOCKED_TABLE = ui.LockedTable,
        UI_LOCKED_TABLE_CLASS = UI_LOCKED_TABLE.prototype,
        UI_FORM = ui.Form,
        UI_FORM_CLASS = UI_FORM.prototype,

        UI_FORM_CLASS_HIDE = UI_FORM_CLASS.$hide;

    var UI_EXT_TABLE = ui.ExtTable = 
        inheritsControl(
            UI_LOCKED_TABLE,
            'ui-table',
            function (el, options) {
                options.browser = false;
            },
            function (el, options) {
                var o = createDom('ui-table-expend-layer', 'display:none;position:absolute'),
                    items, item, i, j,
                    me = this;

                this._oExpended = null;

                insertBefore(o, this._uLockedHead.getOuter());
                this._uRowExpendedLayer = $fastCreate(UI_CONTROL, o, this);

                o = createDom('ui-table-head-shadow', 'display:none;position:absolute;left:0px');
                this._eMain.appendChild(o);
                this._uHeadShadow = $fastCreate(UI_CONTROL, o, this);

                //Panel的空行站位元素
                this._ePanelEmpty = this._eMain.appendChild(createDom('ui-table-panel-empty', 'display:none'));
                this._eEmpty = this._eMain.appendChild(createDom('ui-table-empty', 'position:absolute;left:0px;display:none'));
                this._eEmpty.innerHTML = options.emptyText || '暂无数据';

                items = this.getHCells();
                for (i = 0; item = items[i]; i++) {
                    o = item._oOptions;
                    if (o.sortable) {
                        item.setClass('ui-table-hcell-sort');
                        if (o.field == options.sortby) {
                            item.setClass('ui-table-hcell-sort-' + options.orderby);
                        }
                    }
                    if (o.tip) {
                       el = createDom('ui-tip');
                       item._uTip = $fastCreate(UI_TIP, el, this, {target: o.tip});
                       item.getBody().appendChild(el);
                    }
                    if (o.filter) {
                        item.setClass('ui-table-hcell-filter');
                    }
                    if (o.align) {
                        for (j = 0, rows = this.getRows(); j < rows.length; j++) {
                            if (rows[j] && rows[j]._aElements[i]) {
                                rows[j]._aElements[i].className += ' ui-table-cell-align-' + o.align;
                            }
                        }
                    }
                    if (o.editable && o.edittype) {
                        for (j = 0, rows = item.getCells(); j < rows.length; j++) {
                            ext.Editor.init(o.edittype, rows[j], (function (rowIndex, field, key) {
                                return function () {
                                    var map = me.editorConfig || {}, 
                                        options = extend({}, map[field] || {}),
                                        setValue = options.setValue,
                                        getValue = options.getValue;

                                    if (setValue) {
                                        options.setValue = function (value) {
                                            setValue.call(null, this, value, rowIndex, key);
                                        };
                                    }

                                    if (getValue) {
                                        options.getValue = function () {
                                            return getValue.call(null, this, rowIndex, key);
                                        }
                                    }

                                    return options;
                                }
                            })(j, o.field, rows[j].getOuter().getAttribute('data-ecui-editkey')));
                            rows[j].$editorsubmit = (function (rowIndex, field, key) {
                                return function (editLayer, value) {
                                    var options = {index: rowIndex, field: field, key: key};

                                    options.beforeProcess = bind(editLayer.beforeProcess, editLayer);
                                    options.afterProcess = bind(editLayer.afterProcess, editLayer);
                                    options.setError = bind(editLayer.setError, editLayer);
                                    return triggerEvent(me, 'editorsubmit', null, [value, options]);
                                }
                            })(j, o.field, rows[j].getOuter().getAttribute('data-ecui-editkey'));
                        }
                    }
                }

                if (items[0]._oOptions.checkbox) {
                    items = [items[0]].concat(items[0].getCells());
                    for (i = 0; item = items[i]; i++) {
                        j = trim(item.getContent());
                        //如果是false则不显示checkbox
                        if (j != 'false') {
                            item.setContent('');
                            o = item.getBody().appendChild(createDom('ui-checkbox'));
                            item._uCheckbox = $fastCreate(UI_CHECKBOX, o, item, j ? {value: j} : null);
                            if (i != 0) {
                                item._uCheckbox.setSubject(items[0]._uCheckbox);
                            }
                        }
                        else {
                            item.setContent('&nbsp;');
                        }
                    }
                }

                //空行处理
                if (this.getRows().length <= 0) {
                    this.getBody().appendChild(this._ePanelEmpty);
                    this._ePanelEmpty.style.display = '';
                    this._eEmpty.style.display = '';
                    this._uLockedMain.$hide();
                }
            }
        ),

        UI_EXT_TABLE_CLASS = UI_EXT_TABLE.prototype;

    function UI_EXT_TABLE_SET_FLOAT_SCROLL(con) {
        var el;

        el = con._eBrowser ? con._eBrowser : con._uHScrollbar.getOuter();
        el.style.top = MIN(getView().bottom - getPosition(con.getOuter()).top - el.offsetHeight, 
                con.getHeight() - el.offsetHeight) + 'px';
    }

    function UI_EXT_TABLE_GET_CELL(con, index) {
        var rows = con.getRows(), cells,
            cell = null, i = con._nLeft ? con._nLeft : 0;

        cells = rows[index].getCells();
        while (cell = cells[i++]) {
            if (!!cell.getOuter().offsetWidth && cell.getOuter().style.display != 'none') {
                break;
            }
        }

        return cell;
    }

    function bind(fuc, context) {
        return function () {
            fuc.apply(context, Array.prototype.slice.call(arguments));
        }
    }

    UI_EXT_TABLE_CLASS.getCheckedRows = function () {
        var root = this.getHCell(0)._uCheckbox,
            res = [], items, i, item;
        if (root) {
            items = root.getDependents();
            for (i = 0; item = items[i]; i++) {
                if (item.isChecked()) {
                    res.push(item.getParent().getParent());
                }
            }
        }
        return res;
    };

    UI_EXT_TABLE_CLASS.getValues = function () {
        var root = this.getHCell(0)._uCheckbox,
            res = [], items, i, item;
        if (root) {
            items = root.getDependents();
            for (i = 0; item = items[i]; i++) {
                if (item.isChecked()) {
                    res.push(item.getValue());
                }
            }
        }
        return res;
    };

    UI_EXT_TABLE_CLASS.removeRow = function (index) {
        var cell = this._aRows[index].getCell(0),
            row = this.getRow(index);
        if (cell._uCheckbox) {
            disposeControl(cell._uCheckbox);
        }
        
        //将hide置为空是为了提高速度
        //但这样一来表格Body就不能支持单元格合并
        if (row) {
            row.hide = blank;
        }
        UI_LOCKED_TABLE_CLASS.removeRow.call(this, index);
        if (row) {
            delete row.hide;
        }
    }

    UI_EXT_TABLE_CLASS.init = function () {
        var items,
            i, item = this.getHCells()[0];
        
        UI_LOCKED_TABLE_CLASS.init.call(this);

        if (item._oOptions.checkbox) {
            items = [item].concat(item.getCells());
            for (i = 0; item = items[i]; i++) {
                if (item._uCheckbox) {
                    item._uCheckbox.init();
                }
            }
        }
    }

    UI_TABLE_HCELL_CLASS.$click = function () {
        var orderby,
            table = this.getParent(),
            options = this._oOptions;

        UI_CONTROL_CLASS.$click(this);

        if (options.sortable) {
            if (this.getOuter().className.indexOf('-desc') >= 0) {
                orderby = 'asc';
            }
            else if (this.getOuter().className.indexOf('-asc') >= 0) {
                orderby = 'desc';
            }
            else {
                orderby = options.orderby || 'desc';
            }
            triggerEvent(table, 'sort', null, [options.field, orderby]);
        }
        else if (options.filter) {
            ecui.get(options.filter).show(this, 'right');
        }
    };

    UI_EXT_TABLE_CLASS.expendRow = function (index, height, callback) {
        var row = this.getRow(index),
            cells = row.getCells(),
            rowExpendedLayer = this._uRowExpendedLayer,
            cell, cellHeight, cellBaseHeight,
            i = this._nLeft ? this._nLeft : 0;

        if (this._oExpended) {
            this.collapseRow(this._oExpended.index);
        }

        triggerEvent(this, 'beforeexpendrow', null, [index]);

        cell = UI_EXT_TABLE_GET_CELL(this, index);

        cellHeight = cell.getHeight();
        cellBaseHeight = cell.$getBasicHeight();

        if (!cellBaseHeight) {
            cell.cache();
            cellBaseHeight = cell.$getBasicHeight();
        }
        
        this._oExpended = {index: index, cellHeight: cellHeight};

        for (var i = 0, item, el; item = cells[i]; i++) {
            el = createDom('ui-table-expend-cell');
            el.style.height = (cellHeight - cellBaseHeight) + 'px';
            moveElements(item.getOuter(), el, true);
            item.getOuter().appendChild(el);
            item.getOuter().style.verticalAlign = 'top';
        }

        cell._bResizable = true;
        cell.setSize(null, cellHeight + height + cellBaseHeight);
        if ('[object Function]' == Object.prototype.toString.call(callback)) {
            rowExpendedLayer.setContent(callback.call(null, index));
        }
        else {
            rowExpendedLayer.setContent(callback ? callback : '');
        }

        cellHeight = row.getY() 
            + cellHeight 
            + this._uHead.getHeight();

        rowExpendedLayer.setPosition(0, cellHeight + parseInt(this.getBody().style.top, 10));
        rowExpendedLayer._nTop = cellHeight;
        rowExpendedLayer.show();
        rowExpendedLayer.setSize(this._uHead.getWidth() + this.$$paddingLeft + this.$$paddingRight, height);
        this.resize();
        triggerEvent(this, 'afterexpendrow', null, [index, rowExpendedLayer.getBody()]);
    };

    UI_EXT_TABLE_CLASS.collapseRow = function (index) {
        var row = this.getRow(index),
            cells, o, cell,
            i = this._nLeft ? this._nLeft : 0,
            rowExpendedLayer = this._uRowExpendedLayer;

        if (!this._oExpended) {
            return;
        }

        triggerEvent(this, 'beforecollapserow', null, [index, rowExpendedLayer.getBody()]);

        cells = row.getCells();
        cell = UI_EXT_TABLE_GET_CELL(this, index);
        o = createDom();

        rowExpendedLayer.hide();

        for (var i = 0, item; item = cells[i]; i++) {
            moveElements(first(item.getOuter()), o, true);
            item.getOuter().innerHTML =  '';
            moveElements(o, item.getOuter(), true);
            item.getOuter().style.verticalAlign = '';
        }

        cell.setSize(null, this._oExpended.cellHeight);
        row._eFill.style.height = (this._oExpended.cellHeight - cell.$getBasicHeight()) + 'px';

        this._oExpended = null;
        this.resize();

        triggerEvent(this, 'aftercollapserow', null, [index]);
    };

    UI_EXT_TABLE_CLASS.resizeExpended = function () {
        var rowExpendedLayer = this._uRowExpendedLayer,
            el = rowExpendedLayer.getOuter(),
            height = 0, child, i;

        if (!this._oExpended) {
            return;
        }
        //遍历子元素获取内容的实际高度
        el = children(el);
        for (i = 0; child = el[i]; i++) {
            height += child.offsetHeight + parseInt(getStyle(child, 'marginTop'), 10) + parseInt(getStyle(child, 'marginBottom'), 10);
        }
        cell = UI_EXT_TABLE_GET_CELL(this, this._oExpended.index);
        cell.setSize(null, this._oExpended.cellHeight + height + cell.$getBasicHeight());
        this.getRow(this._oExpended.index)._eFill.style.height = (this._oExpended.cellHeight + height) + 'px';
        rowExpendedLayer.setSize(null, height);
        this.resize();
    };

    UI_EXT_TABLE_CLASS.$setSize = function (width, height) {
        var con = this;

        UI_LOCKED_TABLE_CLASS.$setSize.call(this, width, height);

        this._uHeadShadow.setSize(this._uHead.getWidth() + this.$$paddingLeft + this.$$paddingRight);
        this._eEmpty.style.width = (this._uHead.getWidth() + this.$$paddingLeft + this.$$paddingRight) + 'px';
        if (this._uHead.getHeight()) {
            this._eEmpty.style.top = this._uHead.getHeight() + 'px';
        }
    
        if (!this._uVScrollbar) {
            if (this._eBrowser) {
                //IE下如果不添加2px会导致表格宽度问题
                this._eBrowser.style.height = (getScrollNarrow() + 2) + 'px';
                if (this._uHScrollbar.isShow()) {
                    this._eBrowser.style.display = '';
                }
                else {
                    this._eBrowser.style.display = 'none';
                }
            }
            this._eMain.appendChild(this._uHScrollbar.getOuter());
        }

        //重新调整浮动表头与浮动滚动条
        setTimeout(function() {
            con.$pagescroll.call(con);
        }, 0);
    };

    UI_EXT_TABLE_CLASS.$scroll = function () {
        var con = this._uRowExpendedLayer;
        UI_LOCKED_TABLE_CLASS.$scroll.call(this);
        if (con.isShow()) {
            con.setPosition(con.getX(), con._nTop - this.getScrollTop());
        }
    };

    UI_EXT_TABLE_CLASS.$pagescroll = function () {
        var head = this._uHead;
        
        if (!this.isShow()) {
            return;
        }
        UI_LOCKED_TABLE_CLASS.$pagescroll.call(this);
        if (head.getOuter().style.top != '0px') {
            this._uHeadShadow.show();
            this._uHeadShadow.getOuter().style.top = toNumber(head.getOuter().style.top) + head.getHeight() + 'px';
        }
        else {
            this._uHeadShadow.hide();
        }
        if (!this._uVScrollbar) {
            UI_EXT_TABLE_SET_FLOAT_SCROLL(this);
        }
    }

    UI_EXT_TABLE_CLASS.getData = function () {
        var rows = this.getRows(),
            res = [], item, i, o, j, cell;

        for (i = 0; item = rows[i]; i++) {
            o = [];
            j = 0;
            while(cell = item.getCell(j++)) {
                o.push(cell.getContent());
            }
            res.push(o);
        }
        return res;
    }

    UI_EXT_TABLE_CLASS.setChecked = function (values) {
        var rows = this.getRows(),
            values = '|' + values.join('|') + '|', 
            item, i;

        for (i = 0; item = rows[i]; i++) {
            if (item = item.getCell(0)._uCheckbox) {
                if (values.indexOf('|' + item.getValue() + '|') >= 0) {
                    item.setChecked(true);
                }
            }
        }
    }

    UI_EXT_TABLE_CLASS.getHeaderData = function () {
        var rows = this._aHeadRows.slice(),
            colsMax = this.getColumnCount(),
            res = [], item, i, o, j, cell;

        for (i = 0; item = rows[i]; i++) {
            o = [];
            j = 0;
            while(j < colsMax) {
                cell = item.getCell(j++);
                o.push(cell ? cell.getContent() : '');
            }
            res.push(o);
        }
        return res;
    }

    UI_EXT_TABLE_CLASS.highlight = function (idx) {
        var row;

        for (var i = 0, index; index = idx[i]; i++) {
            row = this.getRow(index);
            if (row && row.getOuter().className.indexOf('highlight') < 0) {
                row.alterClass('+highlight');
                getParent(row._eFill).className = row.getMain().className;
            }
        }
    }

    UI_EXT_TABLE_CLASS.unHighlight = function (idx) {
        var row, rows, i;
        
        if (!idx || idx.length <= 0) {
            rows = this.getRows();
        }
        else {
            rows = [];
            for (i = 0; i < idx.length; i++) {
                rows.push(this.getRow(idx[i]));
            }
        }

        for (i = 0; row = rows[i]; i++) {
            if (row.getOuter().className.indexOf('highlight') >= 0) {
                row.alterClass('-highlight');
                getParent(row._eFill).className = row.getMain().className;
            }
        }
    }

    UI_EXT_TABLE_CLASS.getHeaderStructure = function () {
        var rows = this._aHeadRows.slice(),
            res = [], item, i, o, j, cell;

        for (i = 0; item = rows[i]; i++) {
            o = [];
            j = 0;
            while(cell = item._aElements[j++]) {
                o.push({'colSpan': cell.getAttribute('colSpan'), 'rowSpan': cell.getAttribute('rowSpan')});
            }
            res.push(o);
        }
        return res;
    }

    UI_EXT_TABLE_CLASS.setEmptyText = function (text) {
        this._eEmpty.innerHTML = text;
    }

    UI_TABLE_HCELL_CLASS.isShow = function () {
        if (!!this.getOuter().offsetWidth && this.getOuter().style.display != 'none') {
            return true;
        } else {
            return false;
        }
    };

    UI_TABLE_HCELL_CLASS.$hide = function () {
        this._sWidth4H = this._sWidth4H || this.getWidth();
        this.$setStyles('display', 'none', -this._sWidth4H);
    };

    UI_TABLE_HCELL_CLASS.$show = function () {
        if (this._sWidth4H) {
            this.$$width = this._sWidth4H;
        }
        this.$setStyles('display', '', this.getWidth());
    };

    UI_FORM_CLASS.$hide = function () {
        var cons, i, item;

        UI_FORM_CLASS_HIDE.call(this);
        cons = query({type: UI_EXT_TABLE});
        for (i = 0; item = cons[i]; i++) {
            if (item && item.isShow()) {
                item.$pagescroll.call(item);
            }
        }
    };
})();

/**
 * score
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    score.js
 * desc:    评分控件
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/22
 *
 * params:
 *      {Number} max 最大的分值，默认5
 *      {Number} value 初始化分值, 默认0
        {Boolean} static 是否是静态的
 */
(function () {

    var core = ecui,
        ui = core.ui,
        util = core.util,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        blank = util.blank,
        extend = util.extend,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_ITEMS = ui.Items,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype;

    var UI_SCORE = ui.Score = 
            inheritsControl(
                UI_INPUT_CONTROL,
                'ui-score',
                function (el, options) {
                    var max = options.max = options.max || 5,
                        html = [], i;

                    options.hidden = true;
                    options.value = options.value || 0;
                    for (i = 1; i <= max; i++) {
                        html.push('<span ecui="score:'+ i +'"></span>');
                    }
                    el.innerHTML = html.join('');
                },
                function (el, options) {
                    this._bStatic = (options['static'] === true);
                    this.$initItems(); 
                }
            ),
        UI_SCORE_CLASS = UI_SCORE.prototype,

        UI_SCORE_ITEM = UI_SCORE_CLASS.Item = inheritsControl(
            UI_CONTROL, 
            'ui-score-item',
            function (el, options) {
                options.resizable = false;
            },
            function (el, options) {
                this._nScore = options.score;
            }
        ),
        UI_SCORE_ITEM_CLASS = UI_SCORE_ITEM.prototype;

    extend(UI_SCORE_CLASS, UI_ITEMS);

    /**
     * @override
     */
    UI_SCORE_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.$score(this.getValue());
    }

    /**
     * 标记评分
     * @private
     * 
     * @param <Number> score 需要标记的分值
     */
    UI_SCORE_CLASS.$score = function(score) {
        var items = this.getItems(),
            i, item;

        score = score || this.getValue(); 
        for (i = 0; item = items[i]; i++) {
            item.alterClass(i < score ? '+marked' : '-marked');
        }
    };

    /**
     * @override
     */
    UI_SCORE_CLASS.setValue = function (value) {
        UI_INPUT_CONTROL_CLASS.setValue.call(this, value);
        this.$score(value);
    };

    /**
     * @override
     */
    UI_SCORE_CLASS.$alterItems = blank;

    /**
     * 得到图标对应的分值
     * @public
     *
     * @return {Number} 分值
     */
    UI_SCORE_ITEM_CLASS.getScore = function () {
        return this._nScore;
    };

    /*
     * @override
     */
    UI_SCORE_ITEM_CLASS.$click = function (event) {
        if (!this.getParent()._bStatic) {
            this.getParent().setValue(this.getScore());
            UI_INPUT_CONTROL_CLASS.$click.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$mouseout = function () {
        if (!this.getParent()._bStatic) {
            this.getParent().$score();
            UI_CONTROL_CLASS.$mouseout.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$mouseover = function () {
        if (!this.getParent()._bStatic) {
            this.getParent().$score(this.getScore());
            UI_CONTROL_CLASS.$mouseover.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$setSize = blank;
})();

/**
 * @file 工作台首页表格导航菜单
 * @author hades(denghongqi@gmail.com)
 */

 (function() {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        array = core.array,
        string = core.string,
        util = core.util,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        children = dom.children,
        first = dom.first,
        last = dom.last,
        getParent = dom.getParent,
        createDom = dom.create,
        insertBefore = dom.insertBefore,
        insertAfter = dom.insertAfter,
        setStyle = dom.setStyle,
        removeDom = dom.remove,
        addClass = dom.addClass,
        getAttr = dom.getAttribute,
        removeClass = dom.removeClass,
        getPosition = dom.getPosition,
        moveElements = dom.moveElements,
        extend = util.extend,
        blank = util.blank,

        DOCUMENT = document,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype,
        UI_ITEMS = ui.Items;

    var UI_TOOLBAR = ui.Toolbar = 
        inheritsControl(
            UI_CONTROL,
            'ui-toolbar',
            function(el, options) {
                var type = this.getTypes()[0];
            },
            function(el, options) {
                var type = this.getTypes()[0];
                this._nMaxShow = options.maxShow || 5;
                if (children(el).length < this._nMaxShow + 1) {
                    var o = createDom('', '', 'span');
                    moveElements(el, o, true);
                    el.appendChild(o);
                    this.$setBody(o);
                    this.$initItems();
                    var items = this.getItems();
                }
                else {
                    var o = createDom('', '', 'span');
                    moveElements(el, o, true);
                    el.appendChild(o);
                    this.$setBody(o);

                    var e = createDom(type + '-more-out', '', 'div');

                    var num = this._nMaxShow - 1;
                    var o = children(o);
                    for (var i = num; i < o.length; i++) {
                        var clo = createDom('', '', o[i].tagName);
                        clo.innerHTML = o[i].innerHTML;
                        clo.setAttribute(
                            'ecui',
                            getAttr(o[i], 'ecui')
                        );
                        //var clo = baidu.object.clone(o[i]);
                        //var clo = o[i].cloneNode();
                        //clo.innerHTML = o[i].innerHTML;
                        e.appendChild(clo);
                    }

                    el.appendChild(e);
                    this.$initItems();
                    var items = this.getItems();
                    this._MoreMenu = [];
                    for (var i = num; i < o.length; i++) {
                        this._MoreMenu.push(items[i]);
                    }
                }

                this._nItems = this.getItems().length;

                for (var i = 0; i < this._nItems; i++) {
                    var outer = this.getItems()[i].getOuter();
                    var o = createDom(type + '-text', '', 'span');
                    moveElements(outer, o, true);
                    outer.appendChild(o);

                    if (children(el)[1] || i < this._nItems - 1) {
                        var o = createDom(type + '-space', '', 'span');
                        o.innerHTML = '|';
                        outer.appendChild(o);
                    }
                }

                if (children(el)[1]) {
                    var o = createDom(type + '-more', '', 'div');
                    moveElements(children(el)[1], o, true);
                    children(el)[1].appendChild(o);
                    this._uMore = $fastCreate(
                        this.More, 
                        o,
                        this, 
                        {}
                    );
                    flushToolbar(this);
                }
                if (this.getItems() && this.getItems().length) {
                    this.getItems()[0].$setSelected();
                }
            }
        ),
        UI_TOOLBAR_CLASS = UI_TOOLBAR.prototype;

    /**
     * 获取当前选中的值
     */
    UI_TOOLBAR_CLASS.getValue = function() {
        return this._cSelected.getValue();
    };

    /**
     * 刷新控制表格导航菜单项的显示和隐藏
     * @param {ecui.ui.Toolbar} control 导航条控件
     */
    function flushToolbar (control, type) {
        var more = control._uMore;
        var value;
        if (more.getSelected()) {
            value = more.getSelected().getValue();
        }
        for (var i = 0; i < control._MoreMenu.length; i++) {
            var o = control._MoreMenu[i];
            if (value == o.getValue()) {
                o.show();
                if (type == 'select') {
                    o.$setSelected();
                }
            }
            else {
                o.hide();
            }
        }
    };

    /**
     * 下拉菜单子控件
     */
    var UI_TOOLBAR_MORE_CLASS = 
        (UI_TOOLBAR_CLASS.More = inheritsControl(
            UI_CONTROL,
            'ui-toolbar-more',
            function (el, options) {
                var type = this.getTypes()[0];
                setStyle(el, 'z-index', 32764);
                var o = createDom(type + '-button', '', 'span');
                o.innerHTML = '<span '
                    +'style="vertical-align:middle">更多</span>'
                    +'<span class="' + type + '-img"></span>';
                insertBefore(o, el.firstChild);
                var o = createDom();
                el.appendChild(o);
                el = children(el);
                for (var i = 1; i < el.length - 1; i++) {
                    o.appendChild(el[i]);
                }
            },
            function (el, options) {
                var type = this.getTypes()[0];
                addClass(last(el), type + '-options');
                setStyle(last(el), 'position', 'absolute');
                this._uOptions = $fastCreate(
                    this.Options,
                    removeDom(last(el)),
                    this,
                    {}
                );
                this.$setBody(this._uOptions.getBody());
                this.$initItems();
                this._cSelected = this.getItems()[0];
            }
        )).prototype;

    /**
     * 获取‘更多’下拉菜单中选中的item
     * @public
     */
    UI_TOOLBAR_MORE_CLASS.getSelected = function () {
        return this._cSelected;
    };

    /**
     * 更多下拉菜单的选项部分
     */
    var UI_TOOLBAR_MORE_OPTIONS_CLASS = 
        (UI_TOOLBAR_MORE_CLASS.Options = inheritsControl(
            UI_CONTROL,
            'ui-toolbar-more-options'
            )).prototype;

    UI_TOOLBAR_MORE_CLASS.$mouseover = function() {
        UI_CONTROL_CLASS.$mouseover.call(this);
        flushMoreOptions(this);
    };

    UI_TOOLBAR_MORE_CLASS.$mouseout = function () {
        UI_CONTROL_CLASS.$mouseout.call(this);
        this._uOptions.hide();
    }

    function flushMoreOptions(control) {
        var options = control._uOptions;
        var el = options.getOuter();

        if (!getParent(el)) {
            // 第一次显示时需要进行下拉选项部分的初始化，将其挂载到 DOM 树中
            DOCUMENT.body.appendChild(el);
            control.cache(false, true);
        }

        UI_CONTROL_CLASS.show.call(options);

        for (var i = 0; i < control.getItems().length; i++) {
            var o = control.getItems()[i];
            if (control._cSelected == o) {
                o.hide();
            }
            else {
                o.show();
            }
        }

        var pos = getPosition(control.getOuter());
        options.setPosition(
            pos.left + control.getOuter().offsetWidth - el.offsetWidth - 1,
            pos.top + control.getOuter().offsetHeight
        );
    };

    /**
     * 初始化菜单内容
     *
     * @public
     * @param {Object} options 初始化选项
     */
    var UI_TOOLBAR_ITEM_CLASS = 
        (UI_TOOLBAR_CLASS.Item = inheritsControl(
            UI_ITEM,
            'ui-toolbar-item',
            null,
            function (el, options) {
                this._sValue = options.value === undefined 
                    ? getText(el) 
                    : '' + options.value;
            }
        )).prototype;

    extend(UI_TOOLBAR_CLASS, UI_ITEMS);

    UI_TOOLBAR_ITEM_CLASS.getValue = function() {
        return this._sValue;
    };

    /** 
     * 显示条目
     * @public
     */
    UI_TOOLBAR_ITEM_CLASS.show = function() {
        triggerEvent(this, 'show');
        return true;
    };

    /**
     * 隐藏条目
     * @public
     */
    UI_TOOLBAR_ITEM_CLASS.hide = function() {
        triggerEvent(this, 'hide');
    };

    /**
     * 选中该标签
     * @private
     */
    UI_TOOLBAR_ITEM_CLASS.$setSelected = function() {
        var par = this.getParent();
        var type = this.getTypes()[0];
        
        if (par._cSelected) {
            removeClass(
                par._cSelected.getOuter(),
                type + '-selected'
            );
        }

        addClass(
            this.getOuter(),
            type + '-selected'
        );
        
        if (par._cSelected != this) {
            par._cSelected = this;
            triggerEvent(par, 'change');
        }

        triggerEvent(par, 'resize');
    };

    UI_TOOLBAR_ITEM_CLASS.$click = function() {
        UI_CONTROL_CLASS.$click.call(this);
        this.$setSelected();
    };

    UI_TOOLBAR_CLASS.$alterItems = function() {};

    var UI_TOOLBAR_MORE_ITEM_CLASS = 
        (UI_TOOLBAR_MORE_CLASS.Item = inheritsControl(
            UI_ITEM,
            null,
            null,
            function (el, options) {
                this._sValue = options.value === undefined
                    ? getText(el)
                    : '' + options.value;
            }
        )).prototype;

    extend(UI_TOOLBAR_MORE_CLASS, UI_ITEMS);

    UI_TOOLBAR_MORE_ITEM_CLASS.getValue = function() {
        return this._sValue;
    };

    UI_TOOLBAR_MORE_ITEM_CLASS.$click = function() {
        var par = this.getParent();
        par._cSelected = this;
        flushToolbar(par.getParent(), 'select');
        triggerEvent(par, 'mouseout');
    };

 }) ();
/**
 * query-tab
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    query-tab.js
 * desc:    查询类型tab
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/12
 */
(function () {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        string = core.string,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        getOptions = core.getOptions,
        children = dom.children,
        createDom = dom.create,
        trim = string.trim,

        UI_CONTROL = ui.Control,
        UI_TIP = ui.PsTip,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_RADIO = ui.Radio,
        UI_RADIO_CLASS = UI_RADIO.prototype;

    var UI_QUERY_TAB = ui.QueryTab = 
        inheritsControl(
            UI_CONTROL,
            'ui-query-tab',
            null,
            function (el, options) {
                var childs = children(el),
                    type = this.getTypes()[0],
                    i, item, value = options.value;

                this._aItems = [];
                
                for (i = 0; item = childs[i]; i++) {
                    item.className = trim(item.className) + ' ' + type + '-item' + UI_RADIO.TYPES;
                    this._aItems[i] = $fastCreate(this.Item, item, this, getOptions(item));
                    if (value && value == this._aItems[i].getValue()) {
                        this._aItems[i].setChecked(true);
                        this._oCurChecked = this._aItems[i];
                    }
                }
            }
        ),

        UI_QUERY_TAB_CLASS = UI_QUERY_TAB.prototype,
        UI_QUERY_TAB_ITEM = UI_QUERY_TAB_CLASS.Item =
        inheritsControl(
            UI_RADIO, 
            'ui-query-tab-item', 
            null,
            function (el, options) {
                var o;
                if (options.tip) {
                    o = createDom('ui-tip', '', 'span');
                    el.appendChild(o);
                    this._uTip = $fastCreate(UI_TIP, o, this, {target: options.tip});
                }
            }
        ),
        UI_QUERY_TAB_ITEM_CLASS = UI_QUERY_TAB_ITEM.prototype;

    UI_QUERY_TAB_ITEM_CLASS.$click = function () {
        var par = this.getParent(),
            curChecked = par._oCurChecked;
        UI_RADIO_CLASS.$click.call(this);
        if (curChecked && curChecked != this) {
            par._oCurChecked = this;
            triggerEvent(this.getParent(), 'change', null, [this.getValue()]);
        }
    };

    /* override */
    UI_QUERY_TAB_ITEM_CLASS.getItems = function () {
        return this.getParent().getItems();
    };

    UI_QUERY_TAB_CLASS.getItems = function () {
        return this._aItems.slice();
    };

    UI_QUERY_TAB_CLASS.getValue = function () {
        return this._oCurChecked ? this._oCurChecked.getValue() : null;
    };

    UI_QUERY_TAB_CLASS.setValue = function (value) {
        for (var i = 0, item; item = this._aItems[i]; i++) {
            if (item.getValue() == value) {
                item.setChecked(true);
                this._oCurChecked = item;
            }
        }
    };
})();

(function () {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        string = core.string,
        util = core.util,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        getOptions = core.getOptions,
        setFocused = core.setFocused,
        wrapEvent = core.wrapEvent,
        addEventListener = core.addEventListener,
        children = dom.children,
        createDom = dom.create,
        trim = string.trim,
        encodeHTML = string.encodeHTML,
        getByteLength = string.getByteLength,
        sliceByte = string.sliceByte,
        attachEvent = util.attachEvent,
        blank = util.blank,

        DOCUMENT = document,
        REGEXP = RegExp,
        USER_AGENT = navigator.userAgent,
        ieVersion = /msie (\d+\.\d)/i.test(USER_AGENT) ? DOCUMENT.documentMode || (REGEXP.$1 - 0) : undefined,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        
        CHARSET = 'gbk';

        var UI_EXT_EDITOR = ui.ExtEditor = 
        inheritsControl(
            UI_CONTROL,
            'ui-ext-editor',
            function (el, options) {
                var type = this.getTypes()[0];
                var htmls = [
                                '<div class="' + type + '-line-number"></div>',
                                '<div class="' + type + '-edit-area"></div>'
                            ];

                el.innerHTML = htmls.join('');

            },
            function (el, options) {

            });

})();

/**
 * data tree
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    data-tree.js
 * desc:    数据树
 *          在普通树控件的基础上进行扩展
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/12
 */
(function () {
    var core = ecui,
        array = core.array,
        ui = core.ui,
        array = core.array,
        dom = core.dom,
        string = core.string,
        util = core.util,

        $fastCreate = core.$fastCreate,
        getMouseX = core.getMouseX,
        inheritsControl = core.inherits,
        getOptions = core.getOptions,
        disposeControl = core.dispose,
        triggerEvent = core.triggerEvent,
        extend = util.extend,
        indexOf = array.indexOf,
        extend = util.extend,
        toNumber = util.toNumber,
        getStyle = dom.getStyle,
        first = dom.first,
        insertAfter = dom.insertAfter,
        trim = string.trim,
        blank = util.blank,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_TREE_VIEW = ui.TreeView,
        UI_TREE_VIEW_CLASS = UI_TREE_VIEW.prototype,

        UI_DATA_TREE = ui.DataTree = 
        inheritsControl(
            UI_TREE_VIEW,
            'ui-data-tree',
            function (el, options) {
                options.expandSelected = options.expandSelected === true;

                if (first(el) && 'divlabel'.indexOf(first(el).tagName.toLowerCase()) >= 0) {
                    extend(options, getOptions(first(el)));
                }

                if (options.value) {
                    options.value += '';
                }

                options.resizable = false;
            },
            function (el, options) {
                this._aSelected = [];
                this._sValue = options.value;
                this._bHideRoot = options.hideRoot === true; //是否隐藏根节点
                this._bSelectAble = options.selectable !== false;
                this._bMultiSelect = options.multi === true;
                this._bAsyn = options.asyn;
                if (options.asyn && this._aChildren.length <= 0) {
                    this.add('Loadding', null);
                    this.collapse();
                    this._bNeedAsyn = true;                        
                }
            }
        ),
        
        UI_DATA_TREE_CLASS = UI_DATA_TREE.prototype;

    function UI_DATA_TREE_VIEW_FLUSH(control) {
        control.setClass(
            control.getPrimary() + (control._aChildren.length ? control._bCollapsed ? '-collapsed' : '-expanded' : '')
        );
    }

    UI_DATA_TREE_CLASS.init = function () {
        UI_TREE_VIEW_CLASS.init.call(this);

        if (this._bHideRoot && this == this.getRoot()) {
            this.hide();
            this.expand();
        }
    }

    UI_DATA_TREE_CLASS.$setParent = function (parent) {
        var root = this.getRoot(),
            selected = root._aSelected,
            o = this.getParent(), i;

        // 如果当前节点被选中，需要先释放选中
        if ((i = indexOf(selected, this)) >= 0) {
            root.$setSelected(this, false);
        }

        if (this !== root) {
            remove(o._aChildren, this);
            UI_DATA_TREE_VIEW_FLUSH(o);
        }

        UI_CONTROL_CLASS.$setParent.call(this, parent);

        // 将子树区域显示在主元素之后
        if (this._eChildren) {
            insertAfter(this._eChildren, this.getOuter());
        }
    }

    UI_DATA_TREE_CLASS.getValue = function () {
        return this._sValue;
    }

    UI_DATA_TREE_CLASS.getText = function () {
        return trim(this.getContent().replace(/<[^>]+>/g, ''));
    }

    UI_DATA_TREE_CLASS.getSelected = function () {
        if (this == this.getRoot()) {
            return this._aSelected.slice();
        }
    }

    UI_DATA_TREE_CLASS.getSelectedValues = function () {
        var res = [], i, item;
        if (this == this.getRoot()) {
            for (i = 0; item = this._aSelected[i]; i++) {
                res.push(item.getValue());
            }
            return this._bMultiSelect ? res : res[0];
        }
    }

    UI_DATA_TREE_CLASS.setValues = function (values) {
        var item;
        if (indexOf(values, this._sValue) >= 0) {
            this.getRoot().$setSelected(this, true);
            item = this;
            while((item = item.getParent()) && item instanceof UI_TREE_VIEW) {
                if (item.isCollapsed()) {
                    item.expand()
                }
            }
        }
        for (var i = 0, item; item = this._aChildren[i]; i++) {
            item.setValues(values);
        }
    }

    UI_DATA_TREE_CLASS.getItemByValue = function (value) {
        var res = null;

        if (this._sValue == value) {
            res = this;
        }
        for (var i = 0, item; (item = this._aChildren[i]) && res == null; i++) {
            res = item.getItemByValue(value);
        }
        return res;
    }

    UI_DATA_TREE_CLASS.load = function (datasource) {
        var i, item, text;

        for (i = 0; item = this._aChildren[i]; i++) {
            disposeControl(item);
        }
        this._aChildren = [];
        this._eChildren.innerHTML = '';

        for (i = 0; item = datasource[i]; i++) {
            text = item.text;
            item = extend({asyn: this._bAsyn}, item);
            delete item.text;
            this.add(text, null, item).init();
        }
    }

    UI_DATA_TREE_CLASS.$expand = function (item) {
        var superObj = item.getRoot();
        if (item._bNeedAsyn) {
            triggerEvent(superObj, 'load', null, [item.getValue(), function (data) {item.load(data)}]);
            item._bNeedAsyn = false;
        }
    }

    UI_DATA_TREE_CLASS.$click = function (event) {
        var added = null;
        if (event.getControl() == this) {
            UI_CONTROL_CLASS.$click.call(this, event);

            if (getMouseX(this) <= toNumber(getStyle(this.getBody(), 'paddingLeft'))) {
                // 以下使用 event 代替 name
                this[event = this.isCollapsed() ? 'expand' : 'collapse']();
                triggerEvent(this.getRoot(), event, null, [this]);
            }
            else {
                if (indexOf(this.getRoot()._aSelected, this) >= 0) {
                    if (this._bMultiSelect) {
                        added = false;    
                    }
                }
                else {
                    added = true;
                }
                this.getRoot().setSelected(this);
                triggerEvent(this.getRoot(), 'select', null, [this, added == true])
                if (added !== null) {
                    triggerEvent(this.getRoot(), 'change', null, [this.getValue(), added]);
                }
            }
        }
    }

    UI_DATA_TREE_CLASS.getSelectedText = function () {
        var res = [], i, item;
        if (this == this.getRoot()) {
            for (i = 0; item = this._aSelected[i]; i++) {
                res.push(item.getText());
            }
            return res.join(',');
        }
    }

    UI_DATA_TREE_CLASS.setSelectAble = function (enable) {
        var root = this.getRoot(), i;

        if (!this.enable && (i = indexOf(root._aSelected, this)) >= 0) {
            root.$setSelected(this, false);
        }
        this._bSelectAble = enable;
    }

    UI_DATA_TREE_CLASS.$setSelected = function (node, flag) {
        var selected, i;
        if (this == this.getRoot()) {
            selected = this._aSelected;
            i = indexOf(selected, node);
            if (flag === true) {
                if (i < 0) {
                    selected.push(node);
                    node.alterClass('+selected');
                }
            }
            else if (flag === false) {
                if (i >= 0) {
                    selected.splice(i, 1);
                    node.alterClass('-selected');
                }
            }
        }
    }

    UI_DATA_TREE_CLASS.clearSelected = function () {
        var selected, i, item;
        
        if (this == this.getRoot()) {
            selected = this._aSelected;
            while(item = selected[0]) {
                this.$setSelected(item, false);
            }
        }
    }

    UI_DATA_TREE_CLASS.setSelected = function (node, force) {
        var selected, i;

        if (this == this.getRoot() && node._bSelectAble) {
            selected = this._aSelected;                    
            i = indexOf(selected, this);
            if ((i = indexOf(selected, node)) >= 0) {
                if (!force && this._bMultiSelect) {
                    this.$setSelected(node, false);
                }
            }
            else {
                if (!this._bMultiSelect && selected.length >= 1) {
                    this.$setSelected(selected[0], false);
                }
                this.$setSelected(node, true);
            }

            if (node && this._bExpandSelected) {
                node.expand();
            }
        }
    };

    UI_DATA_TREE_CLASS.$setSize = blank;
})();

/**
 * input tree
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    input-tree.js
 * desc:    树层级输入框
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/12
 */
(function () {
    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        util = core.util,
        string = core.string,

        $fastCreate = core.$fastCreate,
        setFocused = core.setFocused,
        disposeControl = core.dispose,
        createDom = dom.create,
        children = dom.children,
        moveElements = dom.moveElements,
        getPosition  = dom.getPosition,
        inheritsControl = core.inherits,
        getView = util.getView,
        extend = util.extend,
        blank = util.blank,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_DATA_TREE = ui.DataTree,
        UI_DATA_TREE_CLASS = UI_DATA_TREE.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,

        UI_INPUT_TREE = ui.InputTree = 
        inheritsControl(
            UI_INPUT_CONTROL,
            'ui-input-tree',
            function (el, options) {
                var type = this.getTypes()[0],
                    o = createDom();
                
                o.innerHTML = '<div class="'+ type +'-layer" ' 
                    + ' style="position:absolute;display:none; z-index:65535; height:230px; width:250px">'
                    + '<div class="'
                    + UI_DATA_TREE.types[0] +'"></div></div>';

                o = o.firstChild;

                moveElements(el, o.lastChild, true);
                options._eLayer = document.body.appendChild(o);
                
                el.innerHTML = '<span class="'+ type +'-text">请选择</span><span class="'+ type +'-cancel"></span><span class="'+ type +'-button"></span><input type="hidden name="'+ options.name +'"" />';

                options.hidden = true;
                if (options.value) {
                    options.value += '';
                }
            },
            function (el, options) {
                var childs;
                
                if (options.value) {
                    UI_INPUT_CONTROL_CLASS.setValue.call(this, options.value);
                }

                childs = children(el);

                this._multi = options.multi || false;
                this._textLength = options.textLength || 15;
                this._eText = childs[0];
                this._uCancel = $fastCreate(this.Cancel, childs[1], this);
                this._uLayer = $fastCreate(this.Layer, options._eLayer, this, {asyn : options.asyn, multi : this._multi});
                options._eLayer = null;

                delete options._eLayer;

                if (options.hideCancel === true) {
                    this._bHideCancel = true;
                    this._uCancel.$hide();
                }
            }
        ),

        UI_INPUT_TREE_CLASS = UI_INPUT_TREE.prototype,

        UI_INPUT_TREE_LAYER = UI_INPUT_TREE_CLASS.Layer = 
        inheritsControl(
            UI_CONTROL,
            'ui-input-tree-layer',
            null,
            function (el, options) {
                el.style.position = 'absolute';
                this._uTree = $fastCreate(this.Tree, el.firstChild, this, {collapsed:true, asyn: options.asyn, multi : options.multi});
            }
        ),
        UI_INPUT_TREE_LAYER_CLASS = UI_INPUT_TREE_LAYER.prototype,
        
        UI_DATA_TREE = ui.DataTree,
        
        UI_INPUT_TREE_CANCEL_CLASS = (UI_INPUT_TREE_CLASS.Cancel = inheritsControl(UI_CONTROL)).prototype,
        UI_INPUT_TREE_LAYER_TREE = UI_INPUT_TREE_LAYER_CLASS.Tree = 
            inheritsControl(
                UI_DATA_TREE,
                null,
                null,
                function (el, options) {
                    this._bAsyn = options.asyn;
                    if (options.asyn && this._aChildren.length <= 0) {
                        var item = this.add('Loading', null);
                        item.canExpanded = false;
                        this.collapse();
                        this._bNeedAsyn = true;                        
                    }
                }
            ),
        UI_INPUT_TREE_LAYER_TREE_CLASS = UI_INPUT_TREE_LAYER_TREE.prototype;

    function UI_INPUT_TREE_FLUSH(con) {
        if (con.getValue() == '') {
            con._uCancel.hide();
        }
        else if (!con._bHideCancel) {
            con._uCancel.show();
        }
    }

    UI_INPUT_TREE_CLASS.$activate = function () {
        this._uLayer.show();
    };

    UI_INPUT_TREE_CLASS.init = function () {
        var value = this.getValue();

        this.setValue(value);
        this._uLayer.init();
        UI_INPUT_CONTROL_CLASS.init.call(this);
    };

    UI_INPUT_TREE_CLASS.$setText = function (value) {
        if (value && value.length > this._textLength) {
            value = value.substring(0, this._textLength) + '...';
        }
        if (!value) {
            value = '请选择';
        }
        this._eText.innerHTML = value;
    };

    UI_INPUT_TREE_CLASS.setValue = function (value) {
        var tree = this._uLayer._uTree;
        
        UI_INPUT_CONTROL_CLASS.setValue.call(this, value);
        tree.clearSelected();
        tree.setValues([value]);
        this.$setText(tree.getSelectedText());
        UI_INPUT_TREE_FLUSH(this);
    };

    UI_INPUT_TREE_CLASS.clear = function () {
        var tree = this._uLayer._uTree;

        tree.clearSelected();
        UI_INPUT_CONTROL_CLASS.setValue.call(this, '');
        this.$setText('');
        UI_INPUT_TREE_FLUSH(this);
    };

    /**
     * 重新收起input-tree,清理用户操作痕迹
     * @public
     */
    UI_INPUT_TREE_CLASS.clearState = function() {
        var tree = this._uLayer._uTree;
        collapseTree(tree);

        function collapseTree(tree) {
            tree.collapse();
            var children = tree.getChildren();
            if (children && children.length) {
                for (var i = 0; i < children.length; i++) {
                    collapseTree(children[i]);
                }
            }
        }
    };

    /**
     * 根据value获取树中的节点
     * @public
     * @param {string} value 
     */
    UI_INPUT_TREE_CLASS.getTreeNodeByValue = function(value) {
        return this._uLayer.getTreeNodeByValue(value);
    };

    /**
     * 设置输入文本框的值
     * @public
     * @param {string} text
     */
    UI_INPUT_TREE_CLASS.setText = function(text) {
        this.$setText(text);
    };

    UI_INPUT_TREE_CLASS.expand = function (value, callback) {
        var me = this;

        this._uLayer.expand(value, function () {
            callback.call(me);
        });
    };

    UI_INPUT_TREE_CLASS.selectParent = function (value) {
        var node = this._uLayer.getTreeNodeByValue(value);

        if (node != node.getRoot()) {
            node = node.getParent();
        }
        
        this.setValue(node.getValue());
    };

    UI_INPUT_TREE_LAYER_CLASS.init = function () {
        this._uTree.init();
        UI_CONTROL_CLASS.init.call(this);
    };

    UI_INPUT_TREE_LAYER_CLASS.$blur = function () {
        this.hide();
    };

    UI_INPUT_TREE_LAYER_CLASS.expand = function (value, callback) {
        var tree = this._uTree,
            node = tree.getItemByValue(value);
        if (node) {
            node.expand();
            tree.onexpand(node, callback);
        }
    };

    UI_INPUT_TREE_LAYER_CLASS.getTreeNodeByValue = function (value) {
        return this._uTree.getItemByValue(value);
    };

    UI_INPUT_TREE_LAYER_CLASS.show = function () {
        var par = this.getParent(), pos, o, view;

        UI_CONTROL_CLASS.show.call(this);

        if (par) {
            pos = getPosition(par.getOuter());
            view = getView();
            o = pos.top;
            /*
            if (o + par.getHeight() + this.getHeight() > view.bottom) {
                if (o - view.top > this.getHeight()) {
                    pos.top = o - this.getHeight();
                }
            }
            else {
                pos.top = o + par.getHeight();
            }
            */

            pos.top = o + par.getHeight();

            o = pos.left;
            if (o + this.getWidth() > view.right) {
                pos.left = o + par.getWidth() - this.getWidth();
            }
            else {
                pos.left = o;
            }
            this.setPosition(pos.left, pos.top);
            setFocused(this);
        }
    };

    UI_INPUT_TREE_CANCEL_CLASS.$click = function () {
        var par = this.getParent();
        UI_CONTROL_CLASS.$click.call(this);

        par.$setText('');
        UI_INPUT_CONTROL_CLASS.setValue.call(par, '');
        par._uLayer._uTree.clearSelected();
        UI_INPUT_TREE_FLUSH(par);
    };

    UI_INPUT_TREE_CANCEL_CLASS.$activate = UI_BUTTON_CLASS.$activate;

    UI_INPUT_TREE_LAYER_TREE_CLASS.onselect = function (con, added) {
        var superObj = this.getParent().getParent();
        var tree = this.getParent()._uTree;
        var conValue = con.getValue();
        var conText = con.getText();
        // 如果是多选
        if(superObj._multi) {
            var inputValue = tree.getSelectedValues().join(',');
            UI_INPUT_CONTROL_CLASS.setValue.call(superObj, inputValue);
            superObj.$setText(tree.getSelectedText());
        }
        else {
            UI_INPUT_CONTROL_CLASS.setValue.call(superObj, conValue);
            superObj.$setText(conText);
            this.getParent().hide();
        }
        UI_INPUT_TREE_FLUSH(superObj);
    };

    UI_INPUT_TREE_LAYER_TREE_CLASS.onexpand = function (item, callback) {
        var superObj = this.getParent().getParent(),
            callback = callback || blank;
        
        var layer =  superObj._uLayer.getOuter(),
            scrollHeight = layer.scrollTop;
        var setScroll = function() {
           layer.scrollTop = scrollHeight ;
           layer = null;
        };
        if (item._bNeedAsyn) {
            triggerEvent(superObj, 'loadtree', null, [item.getValue(), function (data) {
                item.load(data); 
                callback.call(null);
                setScroll();
            }]);
            item._bNeedAsyn = false;
        }
        else {
            callback.call(null);
            setScroll();
        }
    };

    UI_INPUT_TREE_LAYER_TREE_CLASS.load = function (datasource) {
        var i, item, text;

        for (i = 0; item = this._aChildren[i]; i++) {
            disposeControl(item);
        }
        this._aChildren = [];
        this._eChildren.innerHTML = '';

        for (i = 0; item = datasource[i]; i++) {
            text = item.text;
            item = extend({asyn: this._bAsyn}, item);
            delete item.text;
            this.add(text, null, item).init();
        }
        
        if (!datasource || datasource.length <= 0) {
            this.setClass(this.getPrimary());
        }
    }
})();

