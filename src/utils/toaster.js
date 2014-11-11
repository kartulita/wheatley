(function (angular, toastr) {
	'use strict';

	angular.module('battlesnake.utils')
		.factory('toastService', toastService)
		.run(function () {		
			if (!toastr) {
				throw new Error('Toastr.js required');
			}
		})
		;

	function toastService() {
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

})(window.angular, window.toastr);
