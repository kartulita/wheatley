(function (angular, _, d3) {
	'use strict';

	angular.module('battlesnake.data-vis')
		.directive('bubbleChart', bubbleChartDirective)
		.controller('bubbleChartController', bubbleChartController)
		;

	function bubbleChartDirective() {
		return {
			restrict: 'EA',
			require: 'bubbleChart',
			controller: 'bubbleChartController',
			scope: {
				data: '=',
				axes: '='
			},
			link: link,
			templateUrl: 'bubble-chart-template.html'
		};

		function link(scope, element, attrs, controller) {
			controller.init(element);
		}
	}

	function bubbleChartController($scope) {
		var scope = $scope;
		var element;

		this.init = initController;
		return;
		
		function initController(_element) {
			element = _element;
			scope.$watchCollection('data', refreshData);
			scope.$watch('axes', refreshData, true);
		}

		function refreshData() {
			if (!scope.axes || !scope.data) {
				scope.model = {};
				return;
			}
			var w = element[0].clientWidth;
			var h = element[0].clientHeight;
			var xr = scope.axes.x.max - scope.axes.x.min;
			var yr = scope.axes.y.max - scope.axes.y.min;
			scope.model.axes = {
				x: {
					min: 0,
					max: w,
				},
				y: {
					min: 0,
					max: h,
				}
			};
			scope.model.data = _(scope.data).map(function (item) {
				return {
					x: (item.x - scope.axes.x.min) / xr * w,
					y: (item.y - scope.axes.y.min) / yr * h,
					r: item.r,
					color: item.color,
					data: item
				};
			});
		}
	}

})(window.angular, window._, window.d3);
