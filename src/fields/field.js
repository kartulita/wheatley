(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('field', fieldProxyFacade);

	function fieldProxyFacade($parse, $injector, $document, element, getset) {
		return function fieldProxyFacadeCallback(scope, element, attrs) {
			var proxyTo = element.camelCase(attrs.type + '-field');
			var type = attrs.type;
			var validatorName = element.camelCase(attrs.validator + '-validator');
			var validator = $injector.get(validatorName);
			var value = getset(attrs.ngModel, scope);
			var directive = $injector.get(proxyTo);
			return directive.compile(element, attrs, null)(scope, element, attrs);
		};
	}

})(angular);

