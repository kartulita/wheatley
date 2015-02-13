(function (angular) {
	'use strict';

	angular.module('battlesnake.data-vis')
		.directive('barChart', barChartDirective);

	function barChartDirective() {
		return {
			restrict: 'EA',
			templateUrl: 'bar-chart-template.html',
			scope: {
				axes: '=',
				data: '='
			}
		};
	}

})(window.angular);
