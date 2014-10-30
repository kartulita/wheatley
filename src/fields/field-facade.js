(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('field', fieldDirective)
		;

	function fieldDirective(directiveProxyService) {
		return {
			restrict: 'E',
			terminal: true,
			priority: 1000000,
			replace: true,
			template: '<label></label>',
			link: function (scope, element, attrs) {
				var purpose = attrs.purpose;
				element
					.addClass('field')
					.addClass('field-' + purpose + '-container')
					.append(
						angular.element('<div/>')
							.addClass('field-label')
							.text(attrs.title)
					);
				directiveProxyService('field:' + purpose, scope, element, attrs, ['purpose'])
					.addClass('field-' + purpose);
				return;
			}
		};
	}

})(angular);
