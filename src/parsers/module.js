(function (angular, _) {
	'use strict';
	/**
	 * @ngdoc module
	 * @module battlesnake.parsers
	 * @requires underscore
	 * @description
	 * Various parsers, including the {@link simpleParseService|Simple Parser}
	 * which converts a stream of one-char tokens to a parse tree, and the
	 * {@link comprehensionService|Comprehension Service} which parses
	 * expressions written using the comprehension syntax, then compiles them
	 * to a regular expression (which parses conforming comprehensions).
	 */

	angular.module('battlesnake.parsers', []);

	if (!_) {
		throw new Error('Underscore.js required');
	}

})(window.angular, window._);
