(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	var defaultSuggestionCount = 8;

	function autocompleteDirective(hintParseService) {
		return {
			restrict: 'E',
			replace: true,
			require: 'choices',
			template:
				'<div class="field-autocomplete">' +
				'<input class="autocomplete-text-box" type="text"' +
				' typeahead="choice as choice.label for choice in choices' +
				' | filter: { label: $viewValue } | limitTo: suggestions"' +
				' ng-model="model.value"' +
				' typeahead-on-select="onSelect($item, $model, $label)"' +
				' typeahead-editable="editable">' +
				'</div>',
			scope: { },
			link: function (scope, element, attrs, choicesController) {
				var hints = hintParseService.parse(attrs.hints,
					{
						custom: false,
						optional: false,
						show: defaultSuggestionCount
					});
				/* Value binding */
				scope.model = { value: undefined, choices: [] };
				scope.onSelect = onSelect;
				/* Choice controller */
				choicesController.rebuildView = setOptions;
				choicesController.updateView = setValue;
				/* Number of suggestions to show */
				scope.suggestions = parseInt(hints.show);
				/* Custom values? */
				scope.editable = hints.custom;

				return;

				function setOptions() {
					scope.choices = choicesController.choices.items;
				}

				function setValue() {
					scope.model.value = choicesController.selected;
				}

				function onSelect(item) {
					if (item) {
						choicesController.viewChanged(item.index);
					}
				}
			}
		};
	}

})(window.angular, window._);
