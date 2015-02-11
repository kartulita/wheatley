(function (angular) {
	'use strict';

	/* http://stackoverflow.com/a/22103188/1156377 */
	angular.module('battlesnake.data-vis')
		.directive('svgViewBox', function () {
			return {
				link: function (scope, element, attrs) {
					attrs.$observe('svgViewBox', function (value) {
						if (value && String(value).trim().length) {
							element[0].setAttribute('viewBox', value);
						}
					});
				}
			};
		});

})(window.angular);
