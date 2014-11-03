(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	var defaultSuggestionCount = 8;

	function autocompleteDirective($parse, hintParseService) {
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
				' typeahead-editable="false">' +
				'</div>',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs, ngModelController) {
				/* Value binding */
				scope.model = { value: null };
				ngModelController.$render = function () {
					scope.model.value = _(scope.choices)
						.findWhere({ value: ngModelController.$viewValue });
				};
				scope.onSelect = function (item, model, label) {
					if (item) {
						ngModelController.$setViewValue(item.value);
					}
					ngModelController.$setValidity('validSelection', !!item);
				};
				/* Number of suggestions to show */
				scope.suggestions = parseInt(attrs.suggestions) || defaultSuggestionCount;
				console.log(scope);
			}
		};
	}

})(window.angular);
