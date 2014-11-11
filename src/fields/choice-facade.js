(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldChoice', choiceDirective);

	function choiceDirective($parse, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-choice');
				var choices = $parse(attrs.choices)(scope);
				var hints = hintParseService.parse(attrs.hints, 
					{
						many: choices.length > 8,
						custom: false,
						multi: false
					});
				var implementation = hints.custom ? 'autocomplete' :
					hints.many ? 'drop-down-list' : 'radio-group';
				directiveProxyService('field:' + implementation, { hints: 'copy' }, scope, element, attrs);
			});
	}

})(window.angular);
