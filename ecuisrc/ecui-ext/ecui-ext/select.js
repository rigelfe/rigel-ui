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
