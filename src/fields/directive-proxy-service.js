(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('directiveProxyService', directiveProxyService);

	function directiveProxyService($compile, _) {
		return function (target, scope, element, attrs, ignoreAttrs) {
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
			$compile(forward)(scope);
			element.append(forward);
			return forward;
		};
	}

})(angular);
