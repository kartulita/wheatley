(function (angular) {
	'use strict';

	angular.module('utils')
		.factory('$', function ($window) {
			var jquery = $window.$;
			if (!jquery) {
				throw new Error('Jquery not found');
			}
			console.warn('WARN: Jquery referenced from Angularjs app');
			return jquery;
		});

})(angular);

