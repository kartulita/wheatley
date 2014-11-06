(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldBoolean', booleanDirective);

	function booleanDirective($parse, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-boolean');
				var booleans = $parse(attrs.booleans)(scope);
				var implementation = 'checkbox';
				directiveProxyService('field:' + implementation, { hints: 'copy' }, scope, element, attrs);
			});
	}

})(window.angular);
