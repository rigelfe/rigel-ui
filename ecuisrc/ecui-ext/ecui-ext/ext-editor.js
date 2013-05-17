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
