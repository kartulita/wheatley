(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	var defaultSuggestionCount = 8;

	function autocompleteDirective(hintParseService) {
		var elements = {
			autocomplete: angular.element('<input/>')
				.attr({
					class: 'autocomplete-text-box',
					type: 'text',
					'ng-model': 'model.value',
					typeahead: 'choice as choice.label for choice in queryChoices($viewValue)',
					'typeahead-on-select': 'onSelect($item, $model, $label)',
					'typeahead-loading': 'model.loading',
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
			};
			scope.queryChoices = queryChoices;
			scope.onSelect = onSelect;
			/* Choice controller */
			choicesController.onSelectionChanged = selectionChanged;
			/* Custom values? */
			scope.editable = hints.custom;

			return;

			function queryChoices(search) {
				var escaped = hints.regexp ? search : !search.length ? '' :
					'(^|\\W)' + search.replace(/[\.\+\*\?\(\)\[\]\|\\\"\^\$]/g, '\\\&');
				var searchRx = new RegExp(escaped, 'i');
				return choicesController.requery()
					.then(function (items) {
						var remaining = parseInt(hints.show) || Infinity;
						return _(items).filter(function (item) {
							return remaining > 0 && searchRx.test(item.label) &&
								!!(remaining--);
						});
					});
			}

			function selectionChanged(item) {
				scope.model.value = item;
			}

			function onSelect(item) {
				if (item) {
					choicesController.viewChanged(item.index);
				}
			}
		}
	}

})(window.angular, window._);
