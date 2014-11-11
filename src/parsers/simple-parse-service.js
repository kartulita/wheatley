(function (angular, _) {
	'use strict';

	angular.module('battlesnake.parsers')
		.factory('simpleParseService', simpleParseService);

	function simpleParseService() {
		simpleParser.parse = simpleParser;
		simpleParser.unparse = simpleUnparser;
		return simpleParser;
	}

	/*
	 * Parses a simple expresion as defined by the language specified
	 *
	 * Useful for creating simple, non-recursive domain specific languages.
	 */
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

	function simpleUnparser(tree, language) {
		return unparseNodes(tree, language);

		function unparseNodes(nodes, phrases) {
			return _(nodes).map(function (node) {
				return unparseNode(node, phrases);
			}).join('');
		}

		function unparseNode(node, phrases) {
			if (node.type === 'text') {
				return node.value;
			} else {
				var block = _(phrases).findWhere({ name: node.type });
				if (block.start === block.end) {
					return block.start;
				} else {
					if (!block) {
						throw new Error('Unknown phrase type: ' + node.type);
					}
					return block.start +
						unparseNodes(node.value, block.subgroups) +
						block.end;
				}
			}
		}

	}

})(window.angular, window._);
