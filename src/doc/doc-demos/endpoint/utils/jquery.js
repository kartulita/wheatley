(function (angular) {
	'use strict';

	angular.module('utils')
		.factory('$', function ($window) {
			var jquery = $window.$;
			if (!jquery) {
				return function () {
					throw new Error('Jquery not found');
				};
			}
			return jquery;
		});

})(angular);

