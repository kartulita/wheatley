(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('simpleParseService', simpleParseService);

	function simpleParseService() {
		return simpleParser;
	}

	/* Parses a simple expresion as defined by the language specified */
	function simpleParser(expr, language) {
		var i = 0;
		return getGroup({ name: 'result', start: null, end: null, subgroups: language });

		/* Parse until the end of the group is reached, and return the parse tree */
		function getGroup(group) {
			var result = [];
			var token = '';
			var c, subgroup;
			/* Entity (self-closing, has no contents) */
			if (group.end === group.start && group.start !== null) {
				return null;
			}
			while ((c = getChar()) !== group.end) {
				/* Test if char marks start of a subgroup */
				if ((subgroup = isSubgroup(c))) {
					endToken();
					result.push({ type: subgroup.name, value: getGroup(subgroup) });
				} else {
					token += c;
				}
			}
			endToken();

			return result;

			/* Store the current token */
			function endToken() {
				if (token.length) {
					result.push({ type: 'text', value: token.trim() });
					token = '';
				}
			}

			/* Is the given character marking the start of a subgroup? */
			function isSubgroup(c) {
				return _(group.subgroups)
					.find(function (group) {
						return group.start === c;
					});
			}
		}

		/* Read the next char of the expression */
		function getChar() {
			if (i > expr.length) {
				throw new Error('Unexpected end of expression');
			} if (i === expr.length) {
				i++;
				return null;
			} else {
				return expr.charAt(i++);
			}
		}
	}

})(window.angular);
