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