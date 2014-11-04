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
				'<div class="field-fixed-list">' +
				'<select class="fixed-list"' +
				' size="{{ list.itemsShown }}">' +
				'<option ng-repeat="choice in choices" ng-value="$index" ' +
				' ng-bind="choice.title" ng-selected="isSelected(choice.value)">' +
				'</option>' +
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
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$formatters.push(packMulti);
				ngModelController.$parsers.push(unpackMulti);
				ngModelController.$render = setViewValue;
				element.on('change', function () {
					scope.$apply(getViewValue);
				});
				scope.isSelected = isSelected;
				setViewValue();
				/* Number of items to show */
				scope.list = {
					itemsShown: parseInt(hints.show),
					multi: hints.multi
				};

				if (hints.multi) {
					element.attr('multiple', 'multiple');
				}

				function isSelected(value) {
					return _(scope.model.value).contains(value);
				}

				function packMulti(value) {
					return value === null ? [] : hints.multi ? value : [value];
				}

				function setViewValue() {
					scope.model.value = ngModelController.$viewValue;
				}

				function getViewValue() {
					var values = _(element.find('option'))
						.filter(function (option) { return option.selected; })
						.map(function (option) { return option.value; })
						.map(function (index) { return scope.choices[index].value; });
					scope.model.value = values;
					ngModelController.$setViewValue(values);
					ngModelController.$setValidity('validSelection', values.length || hints.optional);
				}

				function unpackMulti(value) {
					return hints.multi ? value : value.length ? value[0] : null;
				}
			}
		};
	}

})(window.angular);
