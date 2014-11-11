(function (angular, _) {
	'use strict';

	angular.module('fields')
		.factory('hintParseService', hintParseService);

	var notStr = 'not ';

	function hintParseService() {
		return {
			process: processHints,
			parse: parseHints,
			stringify: stringifyHints
		};

		function processHints(attrs, defaults) {
			var hints = parseHints(attrs.hints, defaults);
			attrs.hints = stringifyHints(hints);
			return hints;
		}

		/* Parse comma-separated hints to object and fill defaults */
		function parseHints(hints, defaults) {
			var notStr = 'not ';
			return _((hints || '').toLowerCase().split(','))
				.chain()
				.map(function (hint) {
					hint = hint.trim();
					var not = hint.substr(0, notStr.length) === notStr;
					if (not) {
						hint = hint.substr(notStr.length);
					}
					return [hint, !not];
				})
				.object()
				.defaults(defaults || {})
				.value();
		}

		function stringifyHints(hints) {
			return _(hints)
				.filter(function (v, k) {
					return k.length > 0;
				})
				.map(function (v, k) {
					return (!v ? notStr : '') + k;
				})
				.join(',');
		}
	}

})(window.angular, window._);
