(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldCheckboxGroup', checkboxGroupDirective);

	function checkboxGroupDirective() {
		return {
			restrict: 'E',
			replace: true,
			require: 'ngModel',
			template:
				'<div class="field-checkbox-group field-choicebox-group">' +
				'<input type="checkbox" style="display: none;">' +
				'<label class="checkbox-item choicebox-item"' +
				' ng-repeat="choice in choices" ng-init="index = $index">' +
				'<input class="checkbox-box choicebox-box" type="checkbox"' +
				' ng-change="onChange()" ng-model="model.value[index]"' +
				' ng-true-value="1" ng-false-value="0" ng-checked="1*model.value[index]">' +
				'<span class="checkbox-label choicebox-label">{{ choice.title }}</span>' +
				'</label>' +
				'</div>',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs, ngModelController) {
				/* Value binding */
				scope.model = { value: [] };
				ngModelController.$render = setViewValue;
				scope.onChange = getViewValue;
				setViewValue();

				function setViewValue() {
					var values = ngModelController.$viewValue;
					scope.model.value = new Array(scope.choices.length);
					for (var i = 0; i < scope.choices.length; i++) {
						scope.model.value[i] = _(values).contains(scope.choices[i].value);
					}
				}

				function getViewValue() {
					var value = ngModelController.$viewValue;
					while (value.length) { value.pop(); }
					scope.model.value.forEach(function (checked, index) {
						if (1*checked) {
							value.push(scope.choices[index].value);
						}
					});
					ngModelController.$setViewValue(value);
				}
			}
		};
	}

})(window.angular, window._);
