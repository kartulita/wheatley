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
			require: 'ngModel',
			template: '<div class="field-drop-down-list"></div>',
			scope: { },
			link: function (scope, element, attrs, ngModelController) {
				/* DOM */
				var control = elements.select.clone();
				element.append(control);
				/* Memo */
				scope.model = { item: undefined };
				ngModelController.$render = modelChanged;
				control.on('change', viewChanged);
				/* Choice builder */
				var choices = listComprehensionService(attrs.choices, scope.$parent);
				choices.oninvalidate = rebuildList;
				/* Bootstrap */
				rebuildList(true);

				/* View value changed */
				function viewChanged() {
					var index = control.val();
					var item = index !== -1 ? choices.items[index] : undefined;
					scope.$apply(function () {
						selectedItem(item);
					});
				}

				/* Model value changed */
				function modelChanged() {
					var select = ngModelController.$viewValue;
					var item = _(choices.items).findWhere({ select: select });
					selectItem(item);
				}

				/* Set selected item */
				function selectItem(item) {
					scope.model.item = item;
					control.val(item ? item.index : -1);
				}

				/* Item has been selected */
				function selectedItem(item) {
					scope.model.item = item;
					ngModelController.$setViewValue(item ? item.select : undefined);
				}

				/* ng jqLite does not support appending multiple elements */
				function appendMany(el, items) {
					_(items).forEach(function (item) {
						el.append(item);
					});
				}

				/* Rebuild list contents */
				function rebuildList(initial) {
					/* Store previous selection */
					var memo = scope.model.item ? scope.model.item.memo : undefined;
					control.empty();
					appendMany(control, choices.grouped ?
						createGroups(_(choices.items).groupBy('group')) :
						createOptions(choices.items));
					/* Update selection */
					if (!initial) {
						var item = _(choices.items).findWhere({ memo: memo });
						selectItem(item);
						selectedItem(item);
					}
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
