(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	var defaultSuggestionCount = 8;

	function autocompleteDirective(hintParseService) {
		return {
			restrict: 'E',
			replace: true,
			require: 'ngModel',
			template:
				'<div class="field-autocomplete">' +
				'<input class="autocomplete-text-box" type="text"' +
				' typeahead="choice as choice.title for choice in choices' +
				' | filter: { title: $viewValue } | limitTo: suggestions"' +
				' ng-model="model.value"' +
				' typeahead-on-select="onSelect($item, $model, $label)"' +
				' typeahead-editable="editable">' +
				'</div>',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs, ngModelController) {
				var hints = hintParseService.parse(attrs.hints,
					{
						custom: false,
						optional: false,
						show: defaultSuggestionCount
					});
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$render = setViewValue;
				scope.onSelect = getViewValue;
				setViewValue();
				/* Number of suggestions to show */
				scope.suggestions = parseInt(hints.show);
				/* Custom values? */
				scope.editable = hints.custom;

				function setViewValue() {
					scope.model.value = _(scope.choices)
						.findWhere({ value: ngModelController.$viewValue });
				}

				function getViewValue(item) {
					if (item) {
						ngModelController.$setViewValue(item.value);
					}
					ngModelController.$setValidity('validSelection', !!item || hints.optional);
				}
			}
		};
	}

})(window.angular, window._);
