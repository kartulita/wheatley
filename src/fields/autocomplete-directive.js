(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	var defaultSuggestionCount = 8;

	function autocompleteDirective(hintParseService, $q) {
		var elements = {
			autocomplete: angular.element('<input/>')
				.attr({
					class: 'autocomplete-text-box',
					type: 'text',
					'ng-model': 'model.value',
					typeahead:
						'choice as choice.label for choice in getChoices($viewValue) |' +
						'filter: { label: $viewValue } |' +
						'limitTo: suggestions',
					'typeahead-on-select': 'onSelect($item, $model, $label)',
					'typeahead-editable': 'editable'
				})
		};
		return {
			restrict: 'E',
			replace: true,
			require: 'choices',
			template: '<div class="field-autocomplete"/>',
			scope: { },
			compile: compile,
			link: link
		};

		function compile(element) {
			element.append(elements.autocomplete.clone());
			return link;
		}
		
		function link(scope, element, attrs, choicesController) {
			var hints = hintParseService.parse(attrs.hints,
				{
					custom: false,
					optional: false,
					regexp: false,
					show: defaultSuggestionCount
				});
			/* Value binding */
			scope.model = {
				value: undefined,
				choices: [],
				getChoices: getChoices
			};
			scope.onSelect = onSelect;
			/* Choice controller */
			choicesController.rebuildView = setOptions;
			choicesController.updateView = setValue;
			/* Number of suggestions to show */
			scope.suggestions = parseInt(hints.show);
			/* Custom values? */
			scope.editable = hints.custom;

			return;

			function getChoices(search) {
				var escaped = hints.regexp ? search : '(^|\W)' +
					search.replace(/[\.\+\*\?\(\)\[\]\|\\\"\^\$]/g, '\\\&');
				searchRx = new RegExp(escaped, 'i');
				// TODO: Use promises throughout comprehension evaluation chain */
				return $q.when(choicesController.choices.getItems)
					.then(function (items) {
						return _(items).filter(function (item) {
							return searchRx.test(item.label);
						});
					});
			}

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
	}

})(window.angular, window._);
