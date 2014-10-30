(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldRadioGroup', radioGroupDirective);

	function radioGroupDirective($parse) {
		var groupIndex = 0;
		return {
			restrict: 'E',
			replace: true,
			template:
				'<div class="field-radio-group">' +
				'<input type="checkbox" style="display: none;">' +
				'<label class="radio-item" ng-repeat="choice in choices">' +
				'<input class="radio-box" type="radio" ' +
				'ng-value="choice.value" ' +
				'ng-attr-name="{{ groupName }}" ' +
				'ng-model="model.value">' +
				'<span class="radio-label">{{ choice.title }}</span>' +
				'</label>' +
				'</div>',
			scope: {
				choices: '=',
				name: '@'
			},
			link: function (scope, element, attrs) {
				var modelName = attrs.ngModel;
				scope.groupName = modelName + groupIndex++;
				var extModel = $parse(modelName);
				scope.model = {
					value: extModel(scope.$parent)
				};
				scope.$watch('model.value', function () {
					extModel.assign(scope.$parent, scope.model.value);
				});
				scope.$parent.$watch(modelName, function () {
					scope.model.value = extModel(scope.$parent);
				});
			}
		};
	}

})(angular);
