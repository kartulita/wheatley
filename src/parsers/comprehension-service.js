(function (angular, _) {
	'use strict';

	angular.module('parsers')
		.factory('comprehensionLanguage', comprehensionLanguage)
		.factory('comprehensionService', comprehensionService)
		;

	/*
	 * Domain specific language for comprehension expressions
	 */
	function comprehensionLanguage() {
		/* Captures are specified as {capture-name} */
		var capture = { name: 'capture', start: '{', end: '}', subgroups: [] };
		/* Optional groups are specified as [stuff], equivalent to [stuff|] */
		var options = { name: 'options', start: '[', end: ']', subgroups: [] };
		/* Choices are specified as [this|that], one option MUST be chosen */
		var choice = { name: 'choice', start: '|', end: '|', subgroups: [] };
		var sentence = [capture, options, choice];
		options.subgroups = sentence;
		return sentence;
	}

	/*
	 * Generates functions that parse comprehensions written in the
	 * comprehension language.
	 *
	 * The comprehension is parsed, then the resulting parse tree is used to
	 * build a regular expression and a capture-group index=>name mapping table.
	 *
	 * The resulting function takes a comprehension expression as its parameter
	 * and parses it, returning an object which is a dictionary, mapping
	 * capture-name to captured-value.
	 */
	function comprehensionService(simpleParseService, comprehensionLanguage) {

		generateComprehensionParser.compile = generateComprehensionParser;

		return generateComprehensionParser;

		function generateComprehensionParser(comprehension) {
			var parseTree = parseComprehensionLanguage(comprehension);
			var comprehensionParser = generateComprehensionRegex(parseTree);
			
			if (window.expect) {
				parseComprehension.parser = comprehensionParser;
			}

			return parseComprehension;

			/* Apply the comprehension regex and pack the results */
			function parseComprehension(value) {
				var matches = value.match(comprehensionParser.regex);
				if (!matches) {
					return undefined;
				}
				var matchMaps = comprehensionParser.matchMaps;

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
						throw new Error('Multiple matches found for key "' + name + '": ' + captured.join(', '));
					} else {
						return '' + matches[captured[0]];
					}
				}
			}
		}

		/* Converts a comprehension spec to a parse tree */
		function parseComprehensionLanguage(sentence) {
			return simpleParseService(sentence, comprehensionLanguage);
		}

		/*
		 * Generates a parser regex and a capture-index mapping from a
		 * comprehension parse tree
		 */
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
			/* Match entire string but allow whitespace at the ends */
			var rx = '^\\s*' + group(root) + '\\s*$';
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
				/*
				 * Non-capturing optional group unless it contains a "choice"
				 * entity as an immediate child token.
				 */
				var isChoice = subexpr
					.some(function (expr) { return expr.type === 'choice'; });
				return group(subexpr) + (isChoice ? '' : '?');
			}

			/* Separate choices */
			function choice() {
				/*
				 * This character serves the same purpose in regular expressions
				 * as it does in comprehension expressions - which makes the
				 * implementation really really easy.
				 */
				return '|';
			}

			/* Output capture group */
			function capture(subexpr) {
				var name = subexpr[0].value;
				if (!_(matchMaps).has(name)) {
					matchMaps[name] = [];
				}
				/*
				 * We create two capture groups in the regex:
				 *   Bare identifier: \b(\S+)
				 *   Braced identifier: (?:{)([^}]+)(?:})
				 */
				matchMaps[name].push(++captureIndex);
				matchMaps[name].push(++captureIndex);
				return '(?:(?:{)([^}]+)(?:})|\\b(\\S+))';
			}

			/* Output text */
			function text(val) {
				/*
				 * We create a non-capturing section which captures the
				 * non-whitespace content of the string exactly, and merely
				 * requires one or more whitespace characters for each whitespace
				 * section of the string.
				 *
				 * Whitespace at the ends is ignored, since we join blocks with
				 * optional whitespace matcher (\s*).
				 */
				return val
					.trim()
					.replace(/[\^\$\.\+\*\?\[\]\(\)\|]/g, '\\$&')
					.replace(/\s+/g, '\\s+');
			}
		}
	}

})(window.angular, window._);