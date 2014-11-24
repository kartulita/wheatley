(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldChoice', choiceDirective);

	function choiceDirective(listComprehensionService, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-choice');
				var hints = hintParseService.parse(attrs.hints, 
					{
						many: true,
						custom: false,
						search: false,
						multi: false
					});
				var implementation = hints.search ? 'autocomplete' :
					hints.custom ? 'autocomplete' :
					hints.many ? 'drop-down-list' : 'radio-button-list';
				directiveProxyService('field:' + implementation, { hints: 'copy' }, scope, element, attrs);
			});
	}

})(window.angular);
