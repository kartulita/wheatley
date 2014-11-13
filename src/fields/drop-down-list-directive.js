(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldDropDownList', dropDownListDirective);

	function dropDownListDirective() {
		return {
			restrict: 'E',
			replace: true,
			template:
				'<select class="field-drop-down-list"' +
				' ng-options="choice.value as choice.title for choice in choices">' +
				'</select>',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs) {
			}
		};
	}

})(window.angular);
