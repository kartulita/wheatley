(function () {
'use strict';

	angular.module('apiModule')
		factory('formDecorator', function () {
			function decorateForm(form, onSave) {
			}
			return {
				decorate: decorateForm
			};
		});

})();
