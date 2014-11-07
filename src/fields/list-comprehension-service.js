(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('listComprehensionService', listComprehensionService);

	function listComprehensionService($parse, comprehensionSyntaxService) {
		var compSyntax = '{select} [as {label}] [group by {group}] for [({key}, {value})|{value}] in] {source} [track by {memo}|{source}';
		var compParser = comprehensionSyntaxService(compSyntax);

		return comprehend;

		function comprehend(expr) {
			var comp = compParser(expr);
			if (!comp.source) {
				throw new Error('Source not specified or comprehension is invalid');
			}
		}
	}

})(window.angular);

