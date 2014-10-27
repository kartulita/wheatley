(function (angular) {
'use strict';

	angular.module('autoform')
		.factory('formDecorator', function () {
			function decorateForm(form, onSave) {
			}
			return {
				decorate: decorateForm
			};
		});

})(angular);
