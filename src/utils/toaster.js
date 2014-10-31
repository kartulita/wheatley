(function (angular) {
	'use strict';

	angular.module('utils')
		.factory('toastr', toastrProxy)
		.factory('toastService', toastService)
		;
		
	function toastrProxy($window) {
		if (!$window.toastr) {
			throw new Error('Toastr not found');
		}
		return $window.toastr;
	}

	function toastService(toastr) {
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
	}

})(window.angular);