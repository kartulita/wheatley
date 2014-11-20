(function (angular) {
	'use strict';

	angular.module('battlesnake.fields')
		.directive('fieldMultichoice', multichoiceDirective);

	function multichoiceDirective($parse, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-multichoice');
				var choices = $parse(attrs.choices)(scope);
				var hints = hintParseService.parse(attrs.hints, 
					{
						many: choices.length > 8,
						custom: false,
						multi: true
					});
				if (hints.custom) {
					/* 
					 * Eventually implement this with a composite:
					 *  - choice:multi,many: for choosing items
					 *  - choice:custom,not many,not multi: find items and add new items.
					 */
					throw new Error('Conflicting hints on choice field: multi, custom');
				}
				var implementation = hints.many ? 'multiselect-fixed-list' : 'checkbox-group';
				directiveProxyService('field:' + implementation, { hints: 'copy' }, scope, element, attrs);
			});
	}

})(window.angular);
