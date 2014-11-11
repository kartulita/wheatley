(function (angular) {
	'use strict';

	angular.module('battlesnake.utils')
		.factory('getset', getset);

	function getset($parse) {
		return function (path, scope) {
			var getter = $parse(path);
			return {
				get: function () { return getter(scope); },
				set: function (value) { return getter.assign(scope, value); }
			};
		};
	}

})(window.angular);