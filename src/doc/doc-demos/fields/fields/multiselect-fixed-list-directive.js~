(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldFixedList', fixedListDirective);

	var defaultItemsShown = 8;

	function fixedListDirective(hintParseService) {
		return {
			restrict: 'E',
			replace: true,
			require: 'ngModel',
			template:
				'<div>' +
				'<select class="field-fixed-list" size="{{ size }}"' +
				' ng-options="choice.value as choice.title for choice in choices"' +
				' ng-if="!multi" ng-model="model.value" ng-change="onSelect()">' +
				'</select>' +
				'<select class="field-fixed-list" size="{{ size }}"' +
				' ng-options="choice.value as choice.title for choice in choices"' +
				' ng-if="multi" ng-model="model.value" ng-change="onSelect()"' +
				' multiple>' +
				'</select>' +
				'</div>',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs, ngModelController) {
				var hints = hintParseService.parse(attrs.hints,
					{
						multi: false,
						optional: false,
						show: defaultItemsShown
					});
				console.log(attrs.hints, hints);
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$render = setViewValue;
				scope.onSelect = getViewValue;
				setViewValue();
				/* Configuration */
				scope.multi = hints.multi;
				scope.size = hints.show;

				function setViewValue() {
					scope.model.value = ngModelController.$viewValue;
				}

				function getViewValue() {
					var value = scope.model.value;
					ngModelController.$setViewValue(value);
					ngModelController.$setValidity('validSelection',
						hints.optional || (hints.multi ? value.length : value !== null));
				}
			}
		};
	}

})(window.angular);
