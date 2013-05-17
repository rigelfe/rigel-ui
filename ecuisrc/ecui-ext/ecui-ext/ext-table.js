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
