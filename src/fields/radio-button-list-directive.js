(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldRadioButtonList', radioButtonListDirective);

	function radioButtonListDirective() {
		var elements = {
			dummy: angular.element('<input type="checkbox" style="display:none;"/>'),
			item: angular.element('<label class="radio-item"/>'),
			button: angular.element('<input class="radio-button" type="radio"/>'),
			group: angular.element('<span class="radio-group"/>'),
			buttonLabel: angular.element('<span class="radio-button-label"/>'),
			groupLabel: angular.element('<span class="radio-group-label"/>')
		};
		var groupIndex = 0;
		return {
			restrict: 'E',
			replace: true,
			require: 'choices',
			template: '<div class="field-radio-button-list"></div>',
			link: function (scope, element, attrs, choicesController) {
				/* DOM */
				var thisGroup = 'field-radio-button-list-' + groupIndex++;
				var buttons = [];
				/* Choice controller */
				choicesController.rebuildView = rebuildList;
				choicesController.updateView = setSelection;

				return;

				/* Radio button selected */
				function radioButtonSelected() {
					var selected = _(buttons)
						.find(function (el) {
							return el.checked;
						});
					var index = selected ? parseInt(selected.value) : -1;
					scope.$apply(function () {
						choicesController.viewChanged(index);
					});
				}

				/* Set selected item */
				function setSelection() {
					var button = choicesController.selected &&
						_(buttons)
							.find(function (el) {
								return parseInt(el.value) === choicesController.selected.index;
							});
					if (button) {
						button.checked = true;
					} else {
						_(buttons).forEach(function (button) {
							button.checked = false;
						});
					}
				}

				/* ng jqLite does not support appending multiple elements */
				function appendMany(el, items) {
					_(items).forEach(function (item) {
						el.append(item);
					});
				}

				/* Rebuild list contents */
				function rebuildList() {
					var choices = choicesController.choices;
					element.empty();
					buttons = [];
					element.append(elements.dummy.clone());
					appendMany(element, choices.grouped ?
						createGroups(_(choices.items).groupBy('group')) :
						createOptions(choices.items));
				}

				/* Create option groups */
				function createGroups(items) {
					return _(items).map(createGroup);
				}

				/* Create an option group */
				function createGroup(opts, name) {
					var label = elements.groupLabel.clone()
						.text(name);
					var group = elements.group.clone()
						.append(label);
					appendMany(group, createOptions(opts));
					return group;
				}

				/* Create options */
				function createOptions(opts) {
					return _(opts).chain().map(createOption).flatten().value();
				}

				/* Create an option */
				function createOption(opt) {
					var label = elements.buttonLabel.clone()
						.text(opt.label);
					var button = elements.button.clone()
						.attr('name', thisGroup)
						.attr('value', opt.index);
					var item = elements.item.clone()
						.append(button)
						.append(label);
					button.on('change', radioButtonSelected);
					buttons.push(button[0]);
					return item;
				}
			}
		};
	}

})(window.angular);
