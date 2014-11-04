(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldRadioGroup', radioGroupDirective);

	function radioGroupDirective() {
		var groupIndex = 0;
		return {
			restrict: 'E',
			replace: true,
			require: 'ngModel',
			template:
				'<div class="field-radio-group">' +
				'<input type="checkbox" style="display: none;">' +
				'<label class="radio-item" ng-repeat="choice in choices">' +
				'<input class="radio-box" type="radio"' +
				' ng-value="choice.value"' +
				' ng-attr-name="{{ groupName }}"' +
				' ng-model="model.value">' +
				'<span class="radio-label">{{ choice.title }}</span>' +
				'</label>' +
				'</div>',
			scope: {
				choices: '=',
				name: '@'
			},
			link: function (scope, element, attrs, ngModelController) {
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$render = function () {
					scope.model.value = ngModelController.$viewValue;
				};
				scope.$watch('model.value', function () {
					ngModelController.$setViewValue(scope.model.value);
				});
				/* Button group name */
				scope.groupName = 'field-radio-group-' + groupIndex++;
			}
		};
	}

})(window.angular);
