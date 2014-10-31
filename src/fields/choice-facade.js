(function (angular, hasAngularUI) {
	'use strict';

	angular.module('fields')
		.directive('fieldChoice', choiceDirective);

	function choiceDirective($parse, directiveProxyService, hintParseService) {
		return directiveProxyService.generateDirective(
			'div',
			function link(scope, element, attrs) {
				element.addClass('field-choice');
				var choices = $parse(attrs.choices)(scope);
				var hints = hintParseService.parse(attrs.hints, 
					{
						many: choices.length > 6,
						custom: false
					});
				var implementation =
					hints.custom ?
						hasAngularUI ?
							'autocomplete' :
							'text-box' :
						hints.many ?
							'drop-down-list' :
							'radio-group';
				directiveProxyService('field:' + implementation, ['hints'], scope, element, attrs);
			});
	}

})(window.angular, window.hasAngularUI);
