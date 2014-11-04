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
				'<div class="field-radio-group field-choicebox-group">' +
				'<input type="checkbox" style="display: none;">' +
				'<label class="radio-item choicebox-item" ng-repeat="choice in choices">' +
				'<input class="radio-box choicebox-box" type="radio"' +
				' ng-value="choice.value"' +
				' ng-attr-name="{{ groupName }}"' +
				' ng-model="model.value">' +
				'<span class="radio-label choicebox-label">{{ choice.title }}</span>' +
				'</label>' +
				'</div>',
			scope: {
				choices: '=',
				name: '@'
			},
			link: function (scope, element, attrs, ngModelController) {
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$render = setViewValue;
				scope.$watch('model.value', getViewValue);
				setViewValue();
				/* Button group name */
				scope.groupName = 'field-radio-group-' + groupIndex++;

				function setViewValue() {
					scope.model.value = ngModelController.$viewValue;
				}

				function getViewValue() {
					ngModelController.$setViewValue(scope.model.value);
				}
			}
		};
	}

})(window.angular);
