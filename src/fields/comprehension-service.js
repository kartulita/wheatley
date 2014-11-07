(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('comprehensionLanguage', comprehensionLanguage)
		.factory('comprehensionService', comprehensionService)
		;

	/* The language for comprehensions */
	/* Text passes through [optional] {capture-name} [choice|other-choice] */
	function comprehensionLanguage() {
		var capture = { name: 'capture', start: '{', end: '}', subgroups: [] };
		var options = { name: 'options', start: '[', end: ']', subgroups: [] };
		var choice = { name: 'choice', start: '|', end: '|', subgroups: [] };
		var sentence = [capture, options, choice];
		options.subgroups = sentence;
		return sentence;
	}

	/* Generates functions that parse comprehensions */
	function comprehensionService(simpleParseService, comprehensionLanguage) {

		return function generateComprehensionParser(comprehension) {
			var parseTree = parseComprehensionLanguage(comprehension);
			var comprehensionParser = generateComprehensionRegex(parseTree);
			return parseComprehension;

			/* Apply the comprehension regex and pack the results */
			function parseComprehension(value) {
				var matches = value.match(comprehensionParser.regex);
				var matchMaps = comprehensionParser.matchMaps;
				var result = {};

				return _(matchMaps).reduce(function (result, indices, name) {
					result[name] = getCapture(name, indices);
					return result;
				}, {});

				/* Get the value of a capture */
				function getCapture(name, indices) {
					var captured = indices.filter(function (index) {
						return matches[index] !== undefined;
					});
					if (captured.length === 0) {
						return undefined;
					} else if (captured.length > 1) {
						throw new Error('Multiple matches found for key "' + name + '"');
					} else {
						return '' + matches[captured[0]];
					}
				}
			}
		};

		/* Converts a comprehension spec to a parse tree */
		function parseComprehensionLanguage(sentence) {
			return simpleParseService(sentence, comprehensionLanguage);
		}

		/* Generates a regex and a capture index map from a comprehension parse tree */
		function generateComprehensionRegex(parseTree) {
			var root = parseTree;
			var compiler = {
				text: text,
				capture: capture,
				options: options,
				choice: choice
			};
			var captureIndex = 0;
			var matchMaps = {};
			var rx = ('^\\s*' + group(root) + '\\s*$').replace(/(\\s\*){2,}/g, '\\s*');
			return {
				regex: new RegExp(rx, 'i'),
				matchMaps: matchMaps
			};

			/* Compile a node */
			function compile(node) {
				return compiler[node.type](node.value);
			}

			/* Output non-capturing group */
			function group(subexpr) {
				return '(?:' + subexpr.map(compile).join('\\s*') + ')';
			}
	
			/* Output optional group or choice group */
			function options(subexpr) {
				var isChoice = subexpr.some(function (expr) { return expr.type === 'choice'; });
				return group(subexpr) + (isChoice ? '' : '?');
			}

			/* Separate choices */
			function choice() {
				return '|';
			}

			/* Output capture group */
			function capture(subexpr) {
				var name = subexpr[0].value;
				if (!_(matchMaps).has(name)) {
					matchMaps[name] = [];
				}
				matchMaps[name].push(++captureIndex);
				return '(\\S+?)';
			}

			/* Output text */
			function text(val) {
				return val.trim().replace(/[\^\$\.\+\*\?\[\]\(\)\|]/g, '\\$&').replace(/\s+/g, '\\s');
			}
		}
	}

})(window.angular);
