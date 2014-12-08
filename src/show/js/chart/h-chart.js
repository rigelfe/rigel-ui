/**
 * xui.ui.HChart  
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * @file:    基于highcharts的js图
 *           (最早源自pl-charts.js by treelite(c.xinle@gmail.com))
 * @author:  sushuang(sushuang0322@gmail.com)
 * @depend:  xui, xutil, highcharts
 */

(function () {

    var ieVersion = xutil.dom.ieVersion;
    var addClass = xutil.dom.addClass;
    var removeClass = xutil.dom.removeClass;
    var inheritsObject = xutil.object.inheritsObject;
    var formatNumber = xutil.number.formatNumber;
    var getQuarterBegin = xutil.date.getQuarterBegin;
    var dateToString = xutil.date.dateToString;
    var stringToDate = xutil.date.stringToDate;
    var getQuarter = xutil.date.getQuarter;
    var getWeekend = xutil.date.getWeekend;
    var getWorkday = xutil.date.getWorkday;
    var getQuarterBegin = xutil.date.getQuarterBegin;
    var encodeHTML = xutil.string.encodeHTML;
    var extend = xutil.object.extend;
    var bind = xutil.fn.bind;
    var XOBJECT = xui.XObject;

    /**
     * 基于highcharts的JS图
     *
     * @class
     * @extends {xui.ui.Control}
     */
    var UI_H_CHART = xui.HChart = 
        inheritsObject(
            XOBJECT,
            function (options) {
                var el = options.el;
                this._sType = 'xui-h-chart';
                addClass(el, this._sType);

                options.resizable = false;
                Highcharts.setOptions(this.CHART_OPTIONS);

                var type = this._sType;
                el.innerHTML = [
                    '<div class="' + type + '-header">',
                        '<div class="' + type + '-legend"></div>',
                    '</div>',
                    '<div class="' + type + '-content"></div>'
                ].join('');

                this._eLegend = el.childNodes[0].firstChild;
                this._eContent = el.childNodes[1];
            }
        );
    var UI_H_CHART_CLASS = UI_H_CHART.prototype;

    /** 
     * highcharts的默认配置
     *
     * @type {Object}
     * @protected
     */
    UI_H_CHART_CLASS.CHART_OPTIONS = {
        colors: [
            '#50bfc6', 
            '#e9693c', 
            '#0ca961', 
            '#f6ab1a', 
            '#88d915', 
            '#0380ea', 
            '#3c2dc9', 
            '#8e45e9', 
            '#f44dce', 
            '#e21d3d'
        ],
        global: { useUTC: false }
    };

    /** 
     * 周显示
     *
     * @type {Array}
     * @private
     */
    var STR_WEEKDAY = [
        '周日', '周一', '周二', '周三', '周四', '周五', '周六'
    ];

    /**
     * 一天的毫秒数
     */
    var DAY_MILL = 1000 * 60 * 60 * 24;

    /**
     * 全局margin
     */
    var CHART_MARGIN_RIGHT = 35;

    /**
     * 扩展的rangeSelector类型（及其转换方法）
     * 其中新定义了by属性，
     * 如果值为'max'则意为窗口右界会设为最大值
     * 如果值为'current'则意为窗口右界不动（默认）
     *
     * @type {Object}
     * @protected
     */
    UI_H_CHART_CLASS.EXT_RANGE_SELECTOR_TYPE = {
        thisMonth: function (btn) {
            btn.type = function (options) {
                var now = new Date(options.newMax);
                return {
                    newMin: new Date(
                            now.getFullYear(), 
                            now.getMonth(), 
                            1
                        ).getTime()
                }
            };
        },
        thisQuarter: function (btn) {
            btn.type = function (options) {
                return {
                    newMin: getQuarterBegin(
                            new Date(options.newMax)
                        ).getTime()
                }
            };
        },
        thisYear: function (btn) {
            btn.type = function (options) {
                var now = new Date(options.newMax);
                return {
                    newMin: new Date(now.getFullYear(), 0, 1).getTime()
                }
            };
        },
        // highcharts提供的month算不准，所以新做xMonth。
        // xMonth中，当btn.count == 1时，和thisMonth等价
        xMonth: function (btn) {
            btn.type = function (options) {
                var now = new Date(options.newMax);
                return {
                    newMin: new Date(
                            now.getFullYear(), 
                            now.getMonth() - btn.count + 1,
                            1
                        ).getTime()
                }
            };
        },
        // xQuarter中，当btn.count == 1时，和thisQuarter等价
        xQuarter: function (btn) {
            btn.type = function (options) {
                var quarterBegin = getQuarterBegin(new Date(options.newMax));
                quarterBegin.setMonth(
                    quarterBegin.getMonth() - (btn.count - 1) * 3
                );
                return {
                    newMin: quarterBegin.getTime()
                }
            };
        }
    };

    /** 
     * 轴格式解析
     *
     * @type {Object}
     * @protected
     */
    var efmt = UI_H_CHART_CLASS.EXT_AXIS_FORMAT = {};

    /**
     * date 轴格式
     */
    efmt.date = {
        parse: function (dateStr) {
            return dateStr != null
                ? stringToDate(dateStr, 'yyyy-MM-dd').getTime()
                : void 0;
        },
        format: function (timestamp) {
            return dateToString(new Date(timestamp), 'yyyy-MM-dd');
        },
        formatTooltip: function (timestamp) {
            var date = new Date(timestamp);
            return dateToString(date, 'yyyy-MM-dd') 
                + ' (' + STR_WEEKDAY[date.getDay()] + ')';
        },
        inputFormat: '%Y-%m-%d',
        minRange: 2 * 24 * 60 * 60 * 1000
    };

    /**
     * week 轴格式
     */
    efmt.week = {
        parse: efmt.date.parse,
        format: function (timestamp, options) {
            var date = new Date(timestamp);
            var range = (options || {}).range;

            return dateToString(
                    fixByDateRange(getWorkday(date), range), 
                    'yyyy-MM-dd'
                ) 
                + '<br>' 
                + dateToString(
                    fixByDateRange(getWeekend(date), range), 
                    'yyyy-MM-dd'
                );
        },
        formatTooltip: function (timestamp, options) {
            var date = new Date(timestamp);
            var range = (options || {}).range;
            var workday = fixByDateRange(getWorkday(date), range);
            var weekend = fixByDateRange(getWeekend(date), range);
            return dateToString(workday, 'yyyy-MM-dd') 
                + ' (' + STR_WEEKDAY[workday.getDay()] + ')'
                + ' ~ ' 
                + dateToString(weekend, 'yyyy-MM-dd')
                + ' (' + STR_WEEKDAY[weekend.getDay()] + ')';
        },
        formatNavigator: function (timestamp, options) {
            var range = (options || {}).range;
            return dateToString(
                fixByDateRange(getWorkday(new Date(timestamp)), range), 
                'yyyy-MM-dd'
            );
        },
        inputFormat: '%Y-%m-%d',
        minRange: 2 * 7 * 24 * 60 * 60 * 1000
    };

    /**
     * month 轴格式
     */
    efmt.month = {
        parse: function (dateStr) {
            return dateStr != null 
                ? stringToDate(dateStr, 'yyyy-MM').getTime()
                : void 0;
        },
        format: function (timestamp) {
            return dateToString(new Date(timestamp), 'yyyy-MM');
        },
        inputFormat: '%Y-%m',
        minRange: 2 * 31 * 24 * 60 * 60 * 1000
    };

    /**
     * quarter 轴格式
     */
    efmt.quarter = {
        parse: parseQuarter,
        format: function (timestamp) {
            var date = new Date(timestamp);
            return String(
                date.getFullYear() + '-Q' + getQuarter(date)
            );
        },
        inputFormat: '%Y-%q',
        minRange: 2 * 3 * 31 * 24 * 60 * 60 * 1000
    };

    /**
     * year 轴格式
     */
    efmt.year = {
        parse: function (dateStr) {
            return dateStr != null 
                ? new Date(
                    parseInt(dateStr, 10), 0, 1
                ).getTime()
                : void 0;
        },
        format: function (timestamp) {
            return new Date(timestamp).getFullYear();
        },
        inputFormat: '%Y',
        minRange: 2 * 366 * 24 * 60 * 60 * 1000
    };

    /**
     * 解析季度
     */
    function parseQuarter(dateStr) {
        if (dateStr == null) {
            return null;
        }
        var par = [0, 0, 3, 6, 9];
        dateStr = dateStr.split('-Q');
        return new Date(
            parseInt(dateStr[0], 10), 
            par[parseInt(dateStr[1], 10)], 
            1
        ).getTime();
    }

    /**
     * 初始化
     */
    UI_H_CHART_CLASS.init = function () {
    };

    /**
     * 设置数据
     *
     * @public
     * @param {Object} dataWrap 数据
     * @param {boolean=} isSilent 是否静默（不渲染），缺省则为false
     */
    UI_H_CHART_CLASS.setData = function (dataWrap, isSilent) {
        dataWrap = dataWrap || {};

        this._sChartType = dataWrap.chartType || 'line';
        this._bSeriesHasValue = null;
        this._nWidth = dataWrap.width;
        this._nHeight = dataWrap.height;
        /**
         * x轴定义
         * 例如：
         *  xAxis: [
         *      {
         *          type: 'quarter', // 或'category', 'date', 'month'等，参见EXT_AXIS_FORMAT
         *          data: ['2012-Q1', '2012-Q2']
         *      }
         *  ];
         */
        this._aXAxis = dataWrap.xAxis || [];
        /**
         * y轴定义
         * 例如：
         *  xAxis: [
         *      {
         *          format: 'I,III.DD%', // 显示格式
         *          title: '我是y轴上的描述文字'
         *      }
         *  ];
         */
        this._aYAxis = dataWrap.yAxis || [];   
        /**
         * 系列数据
         * 例如：
         *  series: [
         *      {
         *          name: '我是系列1',
         *          data: [1234.1234, 12344.333, 57655]
         *      },
         *      {
         *          name: '我是系列2',
         *          data: [566.1234, 565, 9987]
         *      }
         *  ];
         */
        this._aSeries = dataWrap.series || [];
        /**
         * 用户自定义rangeselector的按钮
         * 例如：
         *  rangeSelector: {
         *      byAxisType: {
         *          date: {
         *              buttons: [
         *                  { type: 'thisMonth', text: '本月', by: 'max' },
         *                  { type: 'all', text: '全部' }
         *              ],
         *              selected: 0
         *          }
         *      }
         *  }
         */
        this._oRangeSelector = dataWrap.rangeSelector || {};
        /**
         * 用户自定义legend的模式（外观+行为）
         * 例如：
         *  legend: { 
         *      xMode: 'PL' // PL模式的legend。缺省则使用默认模式。
         *  }
         */
        this._oLegend = dataWrap.legend || {};
        /**
         * 数据为空时的html
         */
        this._sEmptyHTML = dataWrap.emptyHTML || '数据为空';
             
        !isSilent && this.render();
    };

    /**
     * 设置数据
     *
     * @protected
     */
    UI_H_CHART_CLASS.$setupSeries = function (options) {
        var series = [];
        var xAxis = this._aXAxis[0];

        for (var i = 0, ser, serDef; serDef = this._aSeries[i]; i ++) {
            ser = { data: [] };
            ser.name = serDef.name || '';
            ser.yAxis = serDef.yAxisIndex || 0;
            ser.color = serDef.color || void 0;
            ser.format = serDef.format || void 0;
            serDef.id !== null && (ser.id = serDef.id);

            if (xAxis.type in this.EXT_AXIS_FORMAT) {
                // 依据扩展时间类型，对series进行调整，使用[x, y]格式
                ser.data = [];
                for (var j = 0; j < serDef.data.length; j ++) {
                    ser.data.push(
                        [
                            this.EXT_AXIS_FORMAT[xAxis.type].parse(xAxis.data[j]),
                            serDef.data[j]
                        ]
                    );
                }
            }
            else {
                ser.data = serDef.data;
            }

            series.push(ser);
        }
        options.series = series;
    }
    
    /**
     * 设置提示浮层
     *
     * @protected
     */
    UI_H_CHART_CLASS.$setupTooptip = function (options) {
        // x轴类型
        var xAxis = this._aXAxis[0];
        var type = xAxis.type; 
        var callback = xAxis.tipCallback;
        var aSeries = this._aSeries;

        var fmt = this.EXT_AXIS_FORMAT[xAxis.type];
        fmt = fmt 
            && (fmt.formatTooltip || fmt.format) 
            || function (o) { return o };

        // 条形图
        if (this._sChartType == 'bar') {
            options.tooltip = {
                useHTML: false,
                shared: true,
                borderColor: '#11A4F2',

                formatter: callback || function () {
                    var htmlArr = [];
                    htmlArr.push(
                        '<span style="color:#4770A7;font-size:13px;font-weight:bold;font-family:\"微软雅黑\",Arial">', 
                            fmt(this.x, { range: xAxis.range }),
                        '</span><br>'
                    );

                    for (var i = 0, o; o = this.points[i]; i ++) {
                        if (o.series.name != null) {
                            htmlArr.push('<span style="color:' + o.series.color + ';font-size:12px;font-weight:bold">' + o.series.name + ': </span>');
                        }
                        htmlArr.push('<span style="color:#000;font-size:12px;font-family:Arial">' + o.point.config[2] + '</span>');
                        if (o.point.config[3] != null) {
                            htmlArr.push(' <span style="color:#000;font-size:12px;font-family:Arial">( ' + o.point.config[3] + ' )</span>');
                        }
                        if (i < this.points.length - 1) {
                            htmlArr.push('<br>');
                        }
                    }
                    return htmlArr.join('');
                }
            }

        } 

        // 其他图
        else {
            options.tooltip = {
                useHTML: false,
                shared: true,
                borderColor: '#11A4F2',

                formatter: callback || function () {
                    var htmlArr = [];
                    htmlArr.push(
                        '<span style="color:#4770A7;line-height:20px;font-size:13px;font-weight:bold;font-family:\"微软雅黑\",Arial">',
                            fmt(this.x, { range: xAxis.range }),
                        '</span><br />'
                    );

                    for (var i = 0, o; o = this.points[i]; i ++) {
                        sFormat = aSeries[i].format;
                        if (o.series.name != null) {
                            htmlArr.push(
                                '<span style="color:' + o.series.color + ';font-size:12px;font-weight:bold">',
                                o.series.name + ': ',
                                '</span>',
                                '<span style="text-align:right;color:#000;font-size:12px;font-family:Arial">',
                                sFormat != null ? formatNumber(o.y, sFormat, null, null, true) : o.y,
                                '</span>'
                            );
                        }
                        if (i < this.points.length - 1) {
                            htmlArr.push('<br>');
                        }
                    }
                    return htmlArr.join('');
                }
            }
        }
    }

    /**
     * 设置x轴
     *
     * @private
     */
    UI_H_CHART_CLASS.$setupXAxis = function (options) {
        var me = this;
        var axisList = [];

        for (
            var axisIndex = 0, xAxisDef, fmt, data; 
            xAxisDef = this._aXAxis[axisIndex]; 
            axisIndex ++
        ) {
            data = xAxisDef.data;

            // range
            if ((fmt = this.EXT_AXIS_FORMAT[xAxisDef.type]) 
                && data 
                && data.length > 0
                && xAxisDef.range
            ) {
                xAxisDef.range = [
                    xAxisDef.range[0] ? fmt.parse(xAxisDef.range[0]) : null,
                    xAxisDef.range[1] ? fmt.parse(xAxisDef.range[1]) : null
                ];
            }

            var xAxis = {
                gridLineWidth: 0,
                gridLineColor: '#DBDBDB',
                tickPosition: 'inside',
                tickLength: 5,
                // startOnTick不要设为true，
                // 因为highstock-1.1.5的bug，true则navigator会
                // 算不准起始点，且拖动后范围越来越大。
                // 暂没空跟这个bug了
                startOnTick: false,
                title: void 0,
                lineColor: xAxisDef.color || '#8CA5C9',
                lineWidth: 2,
                endOnTick: false,
                maxPadding: 0.002,
                minRange: (this.EXT_AXIS_FORMAT[xAxisDef.type] || {}).minRange,
                tickPositioner: (function (
                            me, axisType, isExtAxisType, useYearMonthAdjust
                        ) {
                        return function (min, max) {
                            return tickPositioner.call(
                                this, me, axisType, isExtAxisType, 
                                useYearMonthAdjust, min, max
                            );
                        }
                    })(
                        me, 
                        xAxisDef.type, 
                        xAxisDef.type in this.EXT_AXIS_FORMAT, 
                        xAxisDef.useYearMonthAdjust
                    ),                
                tickPixelInterval: xAxisDef.tickPixelInterval != null 
                    ? xAxisDef.tickPixelInterval
                    : void 0,
                title: this._aXAxis[axisIndex].title != null
                    ? {
                        enabled: true,
                        text: this._aXAxis[axisIndex].title,
                        align: 'high',
                        rotation: 0,
                        tickInterval: 1,
                        offset: 0,
                        y: -12,
                        x: 10
                    }
                    : void 0,
                labels: { 
                    overflow: void 0,
                    formatter: (function (extFormat, xAxisDef) {
                            return function () {
                                var fun = extFormat[xAxisDef.type];
                                return fun 
                                    ? fun.format.call(
                                        null, 
                                        this.value, 
                                        { range: xAxisDef.range }
                                    )
                                    : this.value;
                            }
                        })(this.EXT_AXIS_FORMAT, xAxisDef),
                    style: {
                        fontFamily: 'Arial,Serif,Times', 
                        fontSize: '12px', 
                        color: '#6B6B6B'
                    }
                }
            };

            if (data 
                && !(this._aXAxis[axisIndex].type in this.EXT_AXIS_FORMAT)
            ) {
                xAxis.categories = data;
            }

            if (this._aXAxis[axisIndex].plotLines != null) {
                xAxis.plotLines = [];

                for (
                    var i = 0, o, before, after; 
                    o = this._aXAxis[axisIndex].plotLines[i]; 
                    i ++
                ) {
                    if (o.value != null) {
                        o.value = this.EXT_AXIS_FORMAT[
                            this._aXAxis[axisIndex].type
                        ].parse(o.value);
                        xAxis.plotLines.push(o);
                    } 

                    else if (
                        o.valueBefore != null || o.valueAfter != null
                    ) {

                        before = o.valueBefore != null 
                            ? o.valueBefore : o.valueAfter;
                        after = o.valueAfter != null 
                            ? o.valueAfter : o.valueBefore;

                        o.value = Math.round(
                            (
                                this.EXT_AXIS_FORMAT[
                                    this._aXAxis[axisIndex].type
                                ].parse(before)
                                + this.EXT_AXIS_FORMAT[
                                    this._aXAxis[axisIndex].type
                                ].parse(after)
                            ) / 2
                        );
                        xAxis.plotLines.push(o);
                    }
                }
            }

            axisList.push(xAxis);
        }

        options.xAxis = !axisList.length 
            ? void 0 
            : (axisList.length > 1 ? axisList : axisList[0]);
    }

    /**
     * 设置y轴
     * 支持多轴
     *
     * @private
     */
    UI_H_CHART_CLASS.$setupYAxis = function (options) {
        var yas = []
        var align = ['right', 'left'];
        var opposite = [false, true];
        var labelOffset = [-7, 5];

        for (var i = 0, yAxisDef, o; yAxisDef = this._aYAxis[i]; i++) {
            o = {
                gridLineWidth: 1,
                gridLineColor: '#DBDBDB',                
                lineColor: yAxisDef.color || '#8CA5C9',
                lineWidth: 2,                
                tickPosition: 'inside',
                tickmarkPlacement: 'on',
                labels: {
                    align: align[i % 2],
                    x: this._sChartType == 'bar' ? 20 : labelOffset[i % 2],
                    style: {
                        fontFamily: 'Arial,Serif,Times', 
                        fontSize: '11px', 
                        color: '#6B6B6B'
                    },
                    formatter: yAxisDef.format
                        ? (typeof yAxisDef.format == 'string'
                            ? (function (formatStr) {
                                return function () { 
                                    return formatNumber(this.value, formatStr, null, null, true) 
                                }
                            })(yAxisDef.format)
                            : yAxisDef.format
                        )
                        : void 0
                },
                opposite: opposite[i % 2],
                title: (yAxisDef.title != null && this.$seriesHasValue())
                    ? extend(
                        {
                            enabled: true,
                            align: 'high',
                            rotation: 0,
                            x: 30,
                            y: -10
                        },
                        yAxisDef.title
                    )
                    : void 0
            };

            if (this._sChartType == 'bar') {
                o.tickPixelInterval = 210;        
                o.min = yAxisDef.min; // 暂不允许负值
            }

            yas.push(o);
        }

        options.yAxis = !yas.length 
            ? {} 
            : (yas.length > 1 ? yas : yas[0]);
    };

    /**
     * 序列上有值
     *
     * @private
     */
    UI_H_CHART_CLASS.$seriesHasValue = function () {
        if (this._bSeriesHasValue != null) {
            //取缓存
            return this._bSeriesHasValue;
        }

        for (var i = 0, ser; i < this._aSeries.length; i ++) {
            if ((ser = this._aSeries[i]) && ser.data && ser.data.length) {
                var lineHasValue = false;
                for (var j = 0; j < ser.data.length; j ++) {
                    if (ser.data[j] != null) {
                        lineHasValue = true;
                    }
                }
                if (lineHasValue) {
                    return this._bSeriesHasValue = true;
                }
            }
        }
        return this._bSeriesHasValue = false;
    }

    /**
     * 设置点
     *
     * @protected
     */
    UI_H_CHART_CLASS.$setupPlotOptions = function (options) {
        if (this._sChartType == 'bar') {
            options.plotOptions = {
                bar: {
                    minPointLength: 2,
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        color: '#4770A7',
                        style: {
                            fontWeight: 'bold', 
                            fontFamily: 'Arial', 
                            fontSize: '14px'
                        },
                        formatter: function () {
                            if (this.point.config[3] != null) {
                                return this.point.config[3]; 
                            } 
                            else {
                                return '';
                            }
                        }
                    }
                }
            };
        }
    }

    /**
     * 设置图例
     *
     * @protected
     */
    UI_H_CHART_CLASS.$setupLegend = function (options) {
        // pl模式的legend
        if (this._oLegend.xMode == 'pl') {
            var type = this._sType;

            this._eLegend.style.marginRight = CHART_MARGIN_RIGHT + 'px';

            // 初始化自定义legend
            for (var i = 0, o, ser, color; ser = this._aSeries[i]; i ++) {
                o = document.createElement('span');
                addClass(o, type + '-legend-item');
                color = ser.color || this.CHART_OPTIONS.colors[i];
                o.style.backgroundColor = color;
                o.setAttribute('rel', color);
                o.innerHTML = encodeHTML(ser.name)
                    + '<span class="' + type + '-legend-item-icon"></span>';
                this._eLegend.appendChild(o);

                // 点击事件
                o.onclick = bind(this.$handleLegendClick, this, i, o);
            }

            // 不使用默认legend
            options.legend = { enabled: false };
        }

        // 默认的legend模式
        else {
            options.legend = {
                enabled: true,
                align: 'center',
                borderColor: '#FFF',
                verticalAlign: 'top',
                margin: 15
            };
        }
    }

    /**
     * 图列点击事件处理
     *
     * @protected
     */
    UI_H_CHART_CLASS.$handleLegendClick = function (index, el) {
        var visibleCount = 0;
        var type = this._sType;
        
        this.$foreachSeries(function (ser, index) {
            if (ser && ser.visible) { visibleCount ++; }
        });
        
        // 在highcharts中顺序是一致的，所以可以用index取
        var serie = this._oChart.series[index];
        if (!serie) { return; }
        
        if (serie.visible) {
            if (visibleCount <= 1) {
                return;
            }
            else {
                serie.hide();
                addClass(el, type + '-legend-item-hidden');
                el.style.background = '#B9B9B9';
            }
        }
        else {
            serie.show();
            removeClass(el, type + '-legend-item-hidden');
            el.style.background = el.getAttribute('rel');
        }
    };

    /**
     * 设置区域选择
     * @protected
     */
    UI_H_CHART_CLASS.$setupZoom = function (options) {
        var xAxis = this._aXAxis[0];
        var axisType = xAxis.type;

        options.chart = options.chart || {};
        options.navigator = options.navigator || {};

        // 是否使用zoom和navigator
        if (axisType in this.EXT_AXIS_FORMAT) {
            options.navigator.enabled = true;
            options.scrollbar = { enabled: true };
            options.chart.zoomType = 'x';
            setupRangeSelector.call(this, options, true);
        } 
        else {
            options.navigator.enabled = false;
            options.chart.zoomType = '';
            options.scrollbar = { enabled: false };
            setupRangeSelector.call(this, options, false);
        } 
        
        // navigator初始化
        if (options.navigator.enabled) {
            options.navigator.height = 30;
            options.navigator.series = { 
                dataGrouping: { smoothed: false } 
            };
            var fmt = this.EXT_AXIS_FORMAT[xAxis.type];
            fmt = fmt && fmt.formatNavigator || fmt.format;
            options.navigator.xAxis = { 
                labels: {
                    formatter: function () {
                        return fmt
                            ? fmt.call(null, this.value, { range: xAxis.range })
                            : this.value;
                    },
                    style: { fontFamily: 'Arial', fontSize: '11px' }
                }
            };
        }
    }

    /**
     * 设置区域选择按钮
     *
     * @private
     */
    function setupRangeSelector(options, enabled) {
        var buttons;
        var selected;
        var axisType = this._aXAxis[0].type;
        
        // 禁用rangeselector的情况
        if (!enabled) {
            options.rangeSelector = { enabled: false };
            return;
        }

        var rSele = this._oRangeSelector;
        var rSeleDef = rSele.byAxisType
            // 取axisType对应的buttons定义
            && rSele.byAxisType[axisType]
            // 如果没有，则取通用的buttons定义
            || rSele;
            
        // 有自定义rangeSelector按钮，则取自定义
        if (rSeleDef) {
            buttons = [];
            for (var i = 0, btn, extFn; i < rSeleDef.buttons.length; i ++) {
                buttons.push(btn = extend({}, rSeleDef.buttons[i]));
                // 扩展类型的处理
                if (extFn = this.EXT_RANGE_SELECTOR_TYPE[btn.type]) {
                    extFn(btn);
                }
            }
            selected = rSeleDef.selected;
        }
        // 未自定义rangeSelector按钮，则取默认配置
        else {
            if (axisType == 'date') {
                buttons = [
                    { type: 'month', count: 1, text: '1月' }, 
                    { type: 'month', count: 3, text: '3月' }, 
                    { type: 'month', count: 6, text: '6月' }, 
                    { type: 'year', count: 1, text: '1年' },
                    { type: 'all', text: '全部' }
                ];
                selected = 4;
            } 
            else if (axisType == 'month') {
                buttons = [
                    { type: 'month', count: 6, text: '6月' }, 
                    { type: 'year', count: 1, text: '1年' },
                    { type: 'all', text: '全部' }
                ];
                selected = 2;
            }
            else {
                buttons = [{ type: 'all', text: '全部' }];
                selected = 0;
            }
        }

        options.rangeSelector = {
            enabled: true,
            buttons: buttons,
            selected: selected,
            buttonTheme: {
                fill: 'none',
                stroke: 'none',
                style: { 
                    color: '#282828', 
                    fontFamily: '微软雅黑, Arial' 
                },
                states: {
                    hover: { 
                        fill: 'white', 
                        stroke: '#50bfc6'
                    },
                    select: { 
                        fill: '#d7ebf6', 
                        stroke: '#50bfc6'
                    }
                }
            },
            inputEnabled: true,
            inputDateFormat: this.EXT_AXIS_FORMAT[axisType].inputFormat,
            inputEditDateFormat: this.EXT_AXIS_FORMAT[axisType].inputFormat,
            inputStyle: {
                color: '#3784b7',
                fontWeight: 'bold'
            },
            labelStyle: {
                color: '#b0b0b0',
                fontWeight: 'bold'
            }
        };
    }

    /**
     * 自定义的x轴刻度排布。
     *  尤其对时间类型的窗口进行适配。
     * 默认的刻度排布处理间隔不能准确。
     *
     * @private
     */
    function tickPositioner(
        control, axisType, isExtAxisType, useYearMonthAdjust, min, max
    ) {
        var axis = this;
        var tickPositions = [];

        // 取第一个series进行刻度
        var firstSeries = axis.series[0];
        if( !firstSeries) {
            return [min, max];
        }

        var ordinalPositions = firstSeries.processedXData;

        // 取得当前窗口
        var tmin;
        var tmax;
        var winIndexStart;
        var winIndexEnd;
        var winIndexLength;
        for (
            var i = 0, item, len = ordinalPositions.length;
            i < len; 
            i ++
        ) {
            item = ordinalPositions[i];
            if(item == null) { continue; }

            if (item >= min 
                && (item - min < tmin || typeof tmin == 'undefined')
            ) { 
                winIndexStart = i; 
                tmin = item - min; 
            }
            if (item <= max 
                && (max - item < tmax || typeof tmax == 'undefined')
            ) { 
                winIndexEnd = i; 
                tmax = max - item; 
            }
        }
        if (typeof winIndexEnd == 'undefined' 
            || typeof winIndexStart == 'undefined'
        ) { 
            return [min, max]; 
        }
        winIndexLength = winIndexEnd - winIndexStart + 1;

        // 计算tick的数量和间隔（各种特例处理）
        if (useYearMonthAdjust 
            && axisType == 'date' 
            && (winIndexLength == 365 || winIndexLength == 366)
        ) {
            // 一年全部日数据的特殊处理
            // 这段代码，如果要tick和datasource对上，
            // 必须是精度到天级别的数据源
            // 月从0开始
            var month30 = { '4': 1, '6': 1, '9': 1, '11': 1 }; 
            var d = new Date(ordinalPositions[winIndexEnd]);
            
            var date = d.getDate();
            var month = d.getMonth();
            var year = d.getFullYear();

            while (true) {
                if (month + 1 == 2 && date >= 29) {
                    d = new Date(year, month, 29);
                    if(d.getMonth() + 1 != 2) {
                        d = new Date(year, month, 28);
                    }
                } 
                else if (month + 1 in month30 && date >= 31) {
                    d = new Date(year, month, 30);
                } 
                else {
                    d = new Date(year, month, date);
                }
                if (d.getTime() < ordinalPositions[winIndexStart]) {
                    break;
                }
                tickPositions.splice(0, 0, d.getTime()); 
                (month <= 0) ? (( month = 11) && (year --)) : (month --);
            }
        } 
        else {
            // 默认情况
            var splitNumber = control._aXAxis[0].splitNumber == null 
                    ? (isExtAxisType ? 5 : winIndexLength)
                    : control._aXAxis[0].splitNumber;
            var indexInterval = Math.ceil(winIndexLength / splitNumber);

            for (i = winIndexEnd; i >= winIndexStart; i -= indexInterval) {
                tickPositions.splice(0, 0, ordinalPositions[i]);
            }
        }

        return tickPositions;
    };

    function fixByDateRange(date, range) {
        if (!range || !date) { return date; }
        var timestamp = date.getTime();
        if (timestamp < range[0]) {
            return new Date(range[0]);
        }
        else if (range[1] < timestamp) {
            return new Date(range[1]);
        }
        return date;
    }

    /**
     * 排序Tooltip
     *
     * @private
     * @param {Array} points 待排序的点列表
     * @returns {Array} 排序后的点列表
     */
    UI_H_CHART_CLASS.sortPoints = function (points) {
        if (!points) { return null; }

        var newPoints = [];
        
        for (var i = 0, l = points.length; i < l; i++) {
            newPoints.push(points[i]);
        }
        
        return newPoints.sort(
            function (pa, pb) {
                if (!pa) { return -1; }
                if (!pb) { return 1; }
                
                if (pa.y > pb.y) { return -1; }
                else if (pa.y < pb.y) { return 1; }
                else { return 0; }
            }
        );
    };

    /**
     * 遍历数据series
     * 因为_oChart.series中也包含有flag和navigator的series，
     * 所以用_aSeries来定位具体的数据series，
     * 同时使用_aSeries.length和_oChart.series[i]，因为后者真包含前者，并且顺序对应
     *
     * @protected
     */
    UI_H_CHART_CLASS.$foreachSeries = function (callback) {
        for(var i = 0, len = this._aSeries.length; i < len; i ++) {
            callback(this._oChart.series[i], i);
        }
    };

    /**
     * 重新渲染图表
     *
     * @public
     */
    UI_H_CHART_CLASS.render = function () {
        this.$disposeChart();

        if (!this._aSeries || this._aSeries.length == 0) {
            this._eContent.innerHTML = '' 
                + '<div class="' + this._sType + '-empty">' 
                    + this._sEmptyHTML 
                + '</div>';
            return;
        }

        this.$createChart(this.$initOptions()) ;
    };

    /**
     * 创建图表
     *
     * @public
     */
    UI_H_CHART_CLASS.$createChart = function (options) {
        var res = true;
        switch (this._sChartType) {
            case 'line': 
                options.chart.type = 'line';
                if (this._aXAxis[0].type in this.EXT_AXIS_FORMAT) {
                    // 扩展时间类型，使用stockchart完成
                    this._oChart = new Highcharts.StockChart(options);
                }
                else {
                    this._oChart = new Highcharts.Chart(options);
                }
                break;
            case 'column': 
                options.chart.type = 'column';
                this._oChart = new Highcharts.Chart(options);
                break;
            case 'bar': 
                options.chart.type = 'bar';
                this._oChart = new Highcharts.Chart(options);
                break;
        }
    };

    /**
     * 构建图表参数
     *
     * @private
     */
    UI_H_CHART_CLASS.$initOptions = function () {
        var options = {
            chart: {
                renderTo: this._eContent,
                zoomType: 'x',
                width: this._nWidth,
                height: this._nHeight
            },
            credits: { enabled: false },
            title: {
                text: void 0
            }
        };
        if (this._aYAxis.length > 0) {
            options.chart.marginRight = CHART_MARGIN_RIGHT;
        }
        
        if (!ieVersion) {
            options.plotOptions = { 
                column: { 
                    shadow: true, 
                    borderWidth: 1 
                } 
            };
        }
        
        this.$setupSeries(options);
        this.$setupPlotOptions(options);
        this.$setupXAxis(options);
        this.$setupYAxis(options);
        this.$setupTooptip(options);
        this.$setupLegend(options);
        this.$setupZoom(options);
        
        return options;
    };

    /**
     * 销毁图表
     *
     * @private
     */
    UI_H_CHART_CLASS.$disposeChart = function () {
        if (this._oChart) {
            this._oChart.destroy();
            this._oChart = null;
        }
        this._eContent && (this._eContent.innerHTML = '');
        this._eLegend && (this._eLegend.innerHTML = '');
    };

    /**
     * @override
     */
    UI_H_CHART_CLASS.dispose = function () {
        this.$disposeChart();
        UI_H_CHART_CLASS.superClass.dispose.call(this);
    };

})();
