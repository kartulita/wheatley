(function (angular) {
	'use strict';

	angular.module('utils')
		.factory('_', function ($window) {
			var underscore = $window._;
			if (!underscore) {
				throw new Exception('Underscore not found');
			}
			return underscore;
		});

})(window.angular);