(function (angular) {
	'use strict';

	angular.module('utils')
		.factory('toastr', function ($window) {
			var toastr = $window.toastr;
			if (!toastr) {
				throw new Exception('Toastr not found');
			}
			return toastr;
		})
		.factory('toastService', function (toastr) {
			return {
				success: function (message) {
					toastr.success(message, 'Success');
				},
				error: function (message) {
					toastr.error(message, 'Error');
				},
				info: function (message) {
					toastr.info(message, 'Info');
				},
				warning: function (message) {
					toastr.info(message, 'Warning');
				},
				clear: function () {
					toastr.clear();
				}
			};
		});

})(angular);
