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
			scope: true,
			link: {
				pre: prelink,
				post: postlink
			}
		};
		
		function prelink(scope, element, attrs, ctrl) {
			var choicesController = ctrl[0];
			var ngModelController = ctrl[1];

			/* ngModel => choices lookup */
			ngModelController.$render = modelChangedChoices;

			/* Selected item */
			scope.selectionChanged = selectionChanged;

			return;

			/* Update view */
			function modelChangedChoices() {
				choicesController.modelChanged(ngModelController.$viewValue);
			}

			/* Seleted value changed (update model) */
			function selectionChanged(item) {
				ngModelController.$setViewValue(item && item.select);
			}
		}

		function postlink(scope, element, attrs, ctrl) {
			var choicesController = ctrl[0];

			attrs.$observe('choices', choicesChanged);
			
			function choicesChanged(expr) {
				choicesController.bindComprehension(expr);
			}
			return;
		}
	}

	function choicesController($scope, listComprehensionService) {
		var self = this;

		/* Call this from field directive to update model value */
		this.viewChanged = viewChanged;

		/* Called from choices directive when model value changed */
		this.modelChanged = modelChanged;

		/* Process the comprehension and bind the result */
		this.bindComprehension = bindComprehension;

		this.onSelectionChanged = undefined;
		this.onChoicesChanged = undefined;

		this.requery = requeryChoices;
		this.refresh = refreshChoices;

		var selected = undefined;
		var choices = undefined;
		var items = [];

		return this;

		function setSelected(item) {
			if (item === selected) {
				return;
			}
			selected = item;
			$scope.selectionChanged(selected);
			if (self.onSelectionChanged) {
				self.onSelectionChanged(selected);
			}
		}

		function requeryChoices() {
			return choices.requery();
		}

		function refreshChoices() {
			return choices.refresh();
		}

		function bindComprehension(comprehension) {
			choices = listComprehensionService(comprehension, $scope.$parent, choicesChanged);
			return choices.refresh();
		}

		function choicesChanged(newItems) {
			items = newItems;
			if (self.onChoicesChanged) {
				self.onChoicesChanged(items);
			}
			setSelected(selected && _(items).findWhere({ memo: selected.memo }));
		}

		function modelChanged(select) {
			setSelected(_(items).findWhere({ select: select }));
		}

		function viewChanged(index) {
			if (index === undefined || index === null || index === -1) {
				setSelected(undefined);
			} else {
				setSelected(_(items).findWhere({ index: index }));
			}
		}
	}

})(window.angular, window._);
