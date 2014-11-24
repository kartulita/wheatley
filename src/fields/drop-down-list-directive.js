(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldDropDownList', dropDownListDirective);

	function dropDownListDirective() {
		var elements = {
			select: angular.element(document.createElement('select')),
			option: angular.element(document.createElement('option')),
			optgroup: angular.element(document.createElement('optgroup'))
		};
		return {
			restrict: 'E',
			replace: true,
			require: 'choices',
			template: '<div class="field-drop-down-list"/>',
			compile: compile,
			link: link
		};

		function compile(element) {
			element.append(elements.select.clone());
			return link;
		}

		function link(scope, element, attrs, choicesController) {
			/* Choice controller */
			choicesController.onSelectionChanged = selectionChanged;
			choicesController.onChoicesChanged = choicesChanged;

			/* DOM */
			var control = element.find('select');
			control.on('change', listItemSelected);

			/* View value changed */
			function listItemSelected() {
				var index = parseInt(control.val());
				scope.$apply(function () {
					choicesController.viewChanged(index);
				});
			}

			/* Set selected item */
			function selectionChanged(item) {
				control.val(item && item.index);
			}

			/* ng jqLite does not support appending multiple elements */
			function appendMany(el, items) {
				_(items).forEach(function (item) {
					el.append(item);
				});
			}

			/* Rebuild list contents */
			function choicesChanged(items, grouped) {
				control.empty();
				appendMany(control, grouped ?
					createGroups(_(items).groupBy('group')) :
					createOptions(items));
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
	}

})(window.angular);
