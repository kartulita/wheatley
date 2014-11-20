(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldDropDownList', dropDownListDirective);

	function dropDownListDirective(listComprehensionService) {
		var elements = {
			select: angular.element(document.createElement('select')),
			option: angular.element(document.createElement('option')),
			optgroup: angular.element(document.createElement('optgroup'))
		};
		return {
			restrict: 'E',
			replace: true,
			require: 'choices',
			template: '<div class="field-drop-down-list"></div>',
			link: function (scope, element, attrs, choicesController) {
				/* DOM */
				var control = elements.select.clone();
				element.append(control);
				/* Choices controller */
				choicesController.rebuildView = rebuildList;
				choicesController.updateView = setSelected;
				control.on('change', listItemSelected);

				/* View value changed */
				function listItemSelected() {
					var index = control.val();
					scope.$apply(function () {
						choicesController.viewChanged(index);
					});
				}

				/* Set selected item */
				function setSelected() {
					control.val(choicesController.selected &&
						choicesController.selected.index);
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
					control.empty();
					appendMany(control, choices.grouped ?
						createGroups(_(choices.items).groupBy('group')) :
						createOptions(choices.items));
				}

				/* Create option groups */
				function createGroups(items) {
					return _(items).map(createGroup);
				}

				/* Create an option group */
				function createGroup(opts, name) {
					var optgroup = elements.optgroup.clone()
						.attr('label', name);
					appendMany(optgroup, createOptions(opts));
					return optgroup;
				}

				/* Create options */
				function createOptions(opts) {
					return _(opts).map(createOption);
				}

				/* Create an option */
				function createOption(opt) {
					return elements.option.clone()
						.attr('value', opt.index)
						.text(opt.label);
				}
			}
		};
	}

})(window.angular);
