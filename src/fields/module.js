(function (angular, hasAngularUI) {
	'use strict';

	var deps = ['utils'];
	if (hasAngularUI) {
		deps.push('ui.bootstrap');
	}

	angular.module('fields', deps);

})(window.angular, window.hasAngularUI);