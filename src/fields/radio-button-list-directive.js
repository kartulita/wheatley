(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldRadioButtonList', radioButtonListDirective);

	function radioButtonListDirective(listComprehensionService) {
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
			require: 'ngModel',
			template: '<div class="field-radio-button-list"></div>',
			scope: { },
			link: function (scope, element, attrs, ngModelController) {
				/* DOM */
				var thisGroup = 'field-radio-button-list-' + groupIndex++;
				var buttons = [];
				/* Memo */
				scope.model = { item: undefined };
				ngModelController.$render = modelChanged;
				/* Choice builder */
				var choices = listComprehensionService(attrs.choices, scope.$parent);
				choices.oninvalidate = rebuildList;
				/* Bootstrap */
				rebuildList(true);

				/* View value changed */
				function viewChanged() {
					var selected = _(buttons)
						.find(function (el) {
							return el.checked;
						});
					var index = selected ? parseInt(selected.value) : -1;
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
					var selected = _(buttons)
						.find(function (el) {
							return parseInt(el.value) === item.index;
						});
					if (selected) {
						selected.checked = true;
					} else {
						_(buttons).forEach(function (el) {
							el.checked = false;
						});
					}
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
					element.empty();
					buttons = [];
					element.append(elements.dummy.clone());
					appendMany(element, choices.grouped ?
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
					button.on('change', viewChanged);
					buttons.push(button[0]);
					return item;
				}
			}
		};
	}

})(window.angular);
