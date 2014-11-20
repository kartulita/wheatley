(function (angular, _) {
	'use strict';

	angular.module('battlesnake.fields')
		.controller('choicesController', choicesController)
		.directive('choices', choicesDirective);

	function choicesDirective() {
		return {
			restrict: 'A',
			require: ['choices', 'ngModel'],
			controller: 'choicesController',
			priority: 1,
			link: {
				pre: prelink,
				post: postlink
			}
		};
		
		function prelink(scope, element, attrs, ctrl) {
			var choicesController = ctrl[0];
			var ngModelController = ctrl[1];

			/* ngModel <=> choices binding */
			ngModelController.$render = modelChangedProxy;
			choicesController.selectionChanged = selectionChanged;

			return;

			/* Update view */
			function modelChangedProxy() {
				choicesController.modelChanged(ngModelController.$viewValue);
			}

			/* Seleted value changed (update model) */
			function selectionChanged() {
				var selected = choicesController.selected;
				ngModelController.$setViewValue(selected ? selected.select : undefined);
			}
		}

		function postlink(scope, element, attrs, ctrl) {
			var choicesController = ctrl[0];
			var ngModelController = ctrl[1];

			attrs.$observe('choices', choicesController.bindComprehension);
			return;
		}
	}

	function choicesController($scope, listComprehensionService) {
		var self = this;

		/* Produced by listComprehensionService */
		this.choices = undefined;

		/* Selected item (choices.items[selectedIndex]) */
		this.selected = undefined;

		/* Choices changed, rebuild view */
		this.rebuildView = function () {};

		/* Selection changed, update view */
		this.updateView = function () {};

		/* Called to change the selected item, bound in choices directive */
		this.selectionChanged = undefined;

		/* Call this from field directive to update model value */
		this.viewChanged = viewChanged;

		/* Called from choices directive when model value changed */
		this.modelChanged = modelChanged;

		/* Process the comprehension and bind the result */
		this.bindComprehension = bindComprehension;

		var bound = false;

		return this;

		/* Called when the comprehension expression changes */
		function bindComprehension(comprehension) {
			if (self.choices) {
				self.choices.oninvalidate = undefined;
			}
			self.choices = listComprehensionService(comprehension, $scope);
			self.choices.oninvalidate = choicesInvalidated;
			choicesInvalidated();
		}

		/* Called when model value changes */
		function modelChanged(select) {
			self.selected = _(self.choices.items).findWhere({ select: select });
			self.updateView();
		}

		/* Called when selection changed (params: selected index) */
		function viewChanged(index) {
			if (index === undefined || index === null || index === -1) {
				self.selected = undefined;
			} else if (index < 0 || index >= self.choices.items.length) {
				throw new Error('Index out of bounds (' + index + ')');
			} else {
				self.selected = self.choices.items[index];
			}
			self.selectionChanged();
		}

		/* Choices list refreshed, re-build view */
		function choicesInvalidated() {
			var memo = self.selected ? self.selected.memo : undefined;
			self.rebuildView();
			self.selected = _(self.choices.items).findWhere({ memo: memo });
			if (bound) {
				self.selectionChanged();
				self.updateView();
			} else {
				bound = true;
			}
		}
	}

})(window.angular, window._);
