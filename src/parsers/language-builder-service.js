(function (angular, _) {
	'use strict';
	/** @module parsers */

	angular.module('battlesnake.parsers')
		.factory('languageBuilderService', languageBuilderService);

	/**
	 * Service which exposes the {@link simpleParser|Simple Parser}
	 */
	function languageBuilderService() {
		return languageBuilder;
	}

	/**
	 * Builds a language definition for the simple parser.  Resolves cross-
	 * references, and allows phrases (token groups) to be defined externally to
	 * the token subgroups property, making the language definition syntax
	 * cleaner and more maintainable than the raw syntax which the simple parser
	 * accepts.
	 * @param {object} spec - The language specification
	 *
	 * Example:
	 *   {
	 *     $root: 'phrase',
	 *     phrase: ['capture', 'options', 'choice'],
	 *     capture: { start: '{', end: '}' },
	 *     options: { start: '[', end: ']', subgroups: ['phrase'] },
	 *     choice: { start: '|', end: '|' }
	 *   }
	 *
	 */
	function languageBuilder(spec) {

		/* Create token objects */
		var tokens = _(spec).chain()
			.omit(isPhrase)
			.map(function (value, key) {
				return  {
					name: key,
					start: value.start,
					end: value.end,
					subgroups: value.subgroups
				};
			})
			.value();

		/* Extract phrases and resolve referenced tokens */
		var phrases = _(spec).chain()
			.omit('$root')
			.pick(isPhrase)
			.map(resolveTokens)
			.value();

		/* Resolve subgroups of tokens */
		tokens.forEach(function (token) {
			token.subgroups = resolveSubgroups(token.subgroups);
		});

		/* Resolve root phrase */
		var rootPhrase = _(phrases).findWhere({ name: spec.$root });
		if (rootPhrase === undefined) {
			throw new Error('Language root phrase not specified');	
		}

		return rootPhrase.tokens;

		/* Resolve subgroup to array of tokens */
		function resolveSubgroups(subgroups) {
			if (subgroups === undefined || subgroups === null) {
				return [];
			}
			if (typeof subgroups === 'string') {
				subgroups = subgroups.split(',');
			}
			if (subgroups instanceof Array) {
				return _(subgroups).chain()
					.map(function (name) {
						var token = _(tokens).findWhere({ name: name });
						if (token !== undefined) {
							return token;
						}
						var phrase = _(phrases).findWhere({ name: name });
						if (phrase !== undefined) {
							return phrase.tokens;
						}
						throw new Error('Could not resolve subgroup "' + name +
							'"');
					})
					.flatten()
					.value();
			} else {
				throw new Error('Invalid subgroup definition');
			}
		}

		/* Is value a phrase? */
		function isPhrase(value, key) {
			return value instanceof Array || typeof value === 'string';
		}

		/* Resolve token reference */
		function resolveToken(name) {
			var token = _(tokens).findWhere({ name: name });
			if (token === undefined) {
				throw new Error('Unrecognised token name: "' + name + '"');
			}
			return token;
		}

		/* Convert references to arrays of references, resolve token references */
		function resolveTokens(values, key) {
			values = values instanceof Array ? values :
				typeof values === 'string' ? values.split(',') :
				[];
			return {
				name: key,
				tokens:	_(values).map(resolveToken)
			};
		}
	}


})(window.angular, window._);
