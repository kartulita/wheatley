(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldChoice', choiceDirective);

	function choiceDirective(listComprehensionService, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-choice');
				var choices = listComprehensionService(attrs.choices)(scope);
				var hints = hintParseService.parse(attrs.hints, 
					{
						many: choices.items.length > 8,
						custom: false,
						multi: false
					});
				choices = undefined;
				var implementation = hints.custom ? 'autocomplete' :
					hints.many ? 'drop-down-list' : 'radio-button-list';
				directiveProxyService('field:' + implementation, { hints: 'copy' }, scope, element, attrs);
			});
	}

})(window.angular);
