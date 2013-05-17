(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        util = core.util,

        undefined,
        MATH = Math,
        MAX = MATH.max,

        indexOf = array.indexOf,
        children = dom.children,
        createDom = dom.create,
        first = dom.first,
        getStyle = dom.getStyle,
        moveElements = dom.moveElements,
        encodeHTML = string.encodeHTML,
        getView = util.getView,

        $fastCreate = core.$fastCreate,
        calcHeightRevise = core.calcHeightRevise,
        calcWidthRevise = core.calcWidthRevise,
        getControl = core.getControl,
        drag = core.drag,
        inheritsControl = core.inherits,
        loseFocus = core.loseFocus,
        mask = core.mask,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = ui.Control.prototype,
        UI_BUTTON = ui.Button;


        var orginActive = null;

        function getTopControl(control) {
            if(control && control.getParent && control.getParent()) {
                return getTopControl (control.getParent());
            }
            else {
                return control;
            }
        }

        var orginMouseOver = UI_CONTROL_CLASS.$mouseover;

        UI_CONTROL_CLASS.$mouseover = function(event) { 
            var tar = event.target;
            var tarControl = tar.getControl && tar.getControl();
            var topControl = tarControl && getTopControl(tarControl);

            if (topControl) {
                var controlEle = topControl.getOuter();
                controlEle.style.position = 'relative';
                controlEle.style.overflow = 'visible';

                var uId = topControl._sUID;
                var controlBar = null;
                if(baidu.g(uId + '-control-bar')) {
                    controlBar = baidu.g(uId + '-control-bar');
                }
                else {
                    controlBar = baidu.dom.create('div', {
                        'id' : uId + '-control-bar',
                        'class' : 'controlBar', 
                    });
                    controlBar.innerHTML = '控制条';
                    topControl_Class = topControl.constructor.agent.prototype;
                    topControl_Class.orginActive = topControl_Class.$activate;

                    topControl_Class.$activate = function(event) {
                        if (event.target && baidu.dom.hasClass(event.target, 'controlBar')) {
                            baidu.dom.getParent(event.target).style.zIndex = '65535';
                            drag(this, event);
                        } else {
                            this.orginActive(event);
                        }

                    }
                }
                
                controlEle.appendChild(controlBar);

            }

            if (orginMouseOver) {
                orginMouseOver.call(this, event);
            }

        }

        var orginMouseOut = UI_CONTROL_CLASS.$mouseout;
        UI_CONTROL_CLASS.$mouseout = function(event) { 
            var tar = this;
            var topControl = tar;

            if (topControl) {
                var controlEle = topControl.getOuter();
                var uId = topControl._sUID;
                var controlBar = null;
                if(baidu.g(uId + '-control-bar')) {
                    controlBar = baidu.g(uId + '-control-bar');
                    baidu.dom.remove(controlBar);
                    topControl_Class = topControl.constructor.agent.prototype;
                    topControl_Class.$activate = topControl_Class.orginActive;
                }
            }


            if (orginMouseOut) {
                orginMouseOut.call(this, event);
            }
        }

        // var orginActive = UI_CONTROL_CLASS.$active;
        // UI_CONTROL_CLASS.$active = function() {
        //     orginActive.call(this, event);
        //     drag(this.getParent(), event);
        // }
        var orginMouseUp = UI_CONTROL_CLASS.$mouseup;
        UI_CONTROL_CLASS.$mouseup = function(event) {
            orginMouseUp.call(this, event);
            var target = event.target;
            if(baidu.dom.hasClass(target, 'controlBar')) {
                var control = core.findControl(target);
                var controlEle = control.getOuter();
                controlEle.style.position = 'relative';
                controlEle.style.left = '';
                controlEle.style.top = '';
            }
        }   

})()