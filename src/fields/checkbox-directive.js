(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldCheckbox', checkboxDirective);

	function checkboxDirective() {
		return {
			restrict: 'E',
			replace: true,
			require: 'ngModel',
			template:
				'<div>' +
				'<input class="field-checkbox" type="checkbox"' +
				' ng-change="onChange()" ng-model="model.value"' +
				' ng-true-value="1" ng-false-value="0" ng-checked="1*model.value">' +
				'</div>',
			scope: {
			},
			link: function (scope, element, attrs, ngModelController) {
				/* Value binding */
				scope.model = { value: false };
				ngModelController.$render = setViewValue;
				scope.onChange = getViewValue;
				setViewValue();

				function setViewValue() {
					scope.model.value = !!ngModelController.$viewValue;
				}

				function getViewValue() {
					ngModelController.$setViewValue(!!(1 * scope.model.value));
				}
			}
		};
	}

})(window.angular);
