(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('field', fieldDirective)
		.directive('fieldAuto', fieldDirective)
		;

	function fieldDirective(directiveProxyService) {
		return directiveProxyService.generateDirective(
			'label',
			function link(scope, element, attrs) {
				var purpose = attrs.purpose;
				var title = attrs.title;
				element
					.addClass('field')
					.addClass('field-' + purpose + '-container')
					.append(
						angular.element('<div/>')
							.addClass('field-label')
							.text(title)
					);
				if (purpose === 'auto') {
					throw new Error('Field purpose cannot be "auto"');
				}
				directiveProxyService('field:' + purpose, ['purpose'], scope, element, attrs)
					.addClass('field-' + purpose);
				return;
			});
	}

})(window.angular);
