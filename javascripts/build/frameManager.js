var build = build || {};

build.frameManager = {
	'clearFrameNowAt': function() {
		baidu.each(baidu.dom.query('.frame'), function(frame) {
			baidu.dom.removeClass(frame, 'frame-nowat');
		});
	},
	'setFrameNowAt': function(target) {
		build.frameManager.clearFrameNowAt();
		baidu.dom.addClass(target, 'frame-nowat');
	}
};