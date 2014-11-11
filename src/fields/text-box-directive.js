(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldTextBox', textBoxDirective);

	function textBoxDirective() {
		return {
			restrict: 'E',
			replace: true,
			template: '<input class="field-text-box" type="text">',
		};
	}

})(window.angular);
