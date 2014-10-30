(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldChoice', choiceDirective);

	function choiceDirective($parse, directiveProxyService) {
		return {
			restrict: 'E',
			terminal: true,
			priority: 1000000,
			replace: true,
			template: '<div></div>',
			link: function (scope, element, attrs) {
				element.addClass('field-choice');
				var choices = $parse(attrs.choices)(scope);
				var implementation;
				if (choices.length > 5) {
					implementation = 'drop-down-list';
				} else {
					implementation = 'radio-group';
				}
				directiveProxyService('field:' + implementation, scope, element, attrs);
			}
		};
	}

})(angular);
