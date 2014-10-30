(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('directiveProxyService', directiveProxyService);

	function directiveProxyService($compile, $injector, _) {
		return function (target, scope, element, attrs, ignoreAttrs) {
			/* Ensure target exists (dependency check) */
			var targetName = target
				.replace(/[\s\-\:_]+\w/g, function (s) {
					return s.charAt(s.length - 1).toUpperCase();
				}) + 'Directive';
			$injector.get(targetName);
			/* Create new element */
			var forward = angular.element('<' + target + '/>');
			/* Move attributes over */
			_(attrs).chain()
				.omit(ignoreAttrs || [])
				.omit('class', 'id')
				.omit(function (val, key) { return key.charAt(0) === '$'; })
				.each(function (val, key) {
					element.removeAttr(attrs.$attr[key]);
					forward.attr(attrs.$attr[key], val);
				});
			/* Compile */
			$compile(forward)(scope);
			/* Append to parent */
			element.append(forward);
			return forward;
		};
	}

})(angular);
