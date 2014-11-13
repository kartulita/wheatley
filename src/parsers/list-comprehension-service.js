(function (angular, _) {
	'use strict';

	angular.module('battlesnake.parsers')
		.factory('listComprehensionSyntax', listComprehensionSyntax)
		.factory('listComprehensionService', listComprehensionService)
		;

	/**
	 * @ngdoc constant
	 * @name listComprehensionSyntax
	 *
	 * @description
	 * 
	 * Template syntax for list comprehension expressions.  See
	 * {@link comprehensionService|comprehension service} for syntax
	 * documentation.
	 */
	function listComprehensionSyntax() {
		return '[{select} as] {label} [group by {group}] for [({key}, {value})|{value}] in {source} [track by {memo}]|{source}';
	}

	/**
	 * @ngdoc service
	 * @name listComprehensionService
	 * @param {string} expr - a list comprehension expression
	 * @returns {function}
	 *
	 * @description
	 *
	 * This service takes a {@link listComprehensionSyntax|list comprehension expression}
	 * as a parameter and returns a self-updating view of the underlying data
	 * source where the view is a mapping of the data as specified by the
	 * list comprehension expression.
	 *
	 * @example
	 *
	 *     <my:directive my:source="item.title for item in model.items"/>
	 *
	 *     var sourceInterrogator = comprehend(attrs.mySource);
	 *
	 *     var source = sourceInterrogator(scope.$parent);
	 *
	 *     // items array is updated in-place when underlying model changes
	 *     scope.items = source.items;
	 *
	 *     // oninvalidate is called when the items array has been updated
	 *     source.oninvalidate = function () {
	 *       doStuff();
	 *     };
	 */
	function listComprehensionService($parse, comprehensionService, listComprehensionSyntax) {
		var compParser = comprehensionService(listComprehensionSyntax);

		/* Expose extra functions if Chai is detected */
		if (window.expect || Object.prototype.should) {
			comprehend.test = {
				compile: function () {
					/* Compile from scratch each time for benchmarking */
					return comprehensionService(listComprehensionSyntax);
				},
				parse: function (expr) {
					return compParser(expr);
				},
				fillDefaults: testFillDefaults
			};
		}

		return comprehend;

		/* See documentation for listComprehensionService */
		function comprehend(expr) {
			var comp = compParser(expr);
			fillDefaults(comp);

			/* Function(scope) which gets the item list */
			var sourceGetter = $parse(comp.source);

			/*
			 * Parse mapping expressions and store accessors as
			 * Function(scope, key, value)
			 */
			var params = {
				group: getter(comp.group),
				label: getter(comp.label),
				select: getter(comp.select),
				memo: getter(comp.memo),
			};

			return interrogate;

			/**
			 * @function interrogate
			 * @param {scope} scope - The scope to interrogate
			 * @private
			 *
			 * @description
			 *
			 * Gets the items in a normalized form
			 */
			function interrogate(scope) {
				var result = {
					items: [],
					oninvalidate: null
				};

				/* $watch(..., ..., true) performs a slow but deep watch */
				scope.$watch(comp.source, invalidate, true);

				/* Populate the item list */
				refreshItems();

				return result;

				/* Underlying dataset changed - call oninvalidate */
				function invalidate() {
					refreshItems();
					if (result.oninvalidate) {
						result.oninvalidate();
					}
				}

				/* Refreshes the item list (in-place so by-ref watches work) */
				function refreshItems() {
					result.items.length = 0;
					var newItems = getItems(scope);
					for (var i = 0; i < newItems.length; i++) {
						result.items.push(newItems[i]);
					}
				}

			}

			/**
			 * @function getItems
			 * @private
			 * @param {scope} scope - The scope to evaluate the expression in
			 * @returns {array} Items from the data source, mapped as specified
			 *     by the comprehension expression.
			 */
			function getItems(scope) {
				return _(sourceGetter(scope))
					.map(function (value, key) {
						return {
							select: params.select(scope, key, value),
							label: params.label(scope, key, value),
							memo: params.memo(scope, key, value),
							group: params.group(scope, key, value),
							key: key,
							value: value
						};
					});
			}

			/**
			 * @function getter
			 * @private
			 * @param {string} expr - The expression to evaluate
			 * @returns {function} A function(scope, key, value) which  evaluates
			 *     the given expression.
			 */
			function getter(expr) {
				var parsed = $parse(expr);
				/**
				 * @function get
				 * @private
				 * @param {scope} scope - The scope to evaluate the expression in
				 * @param {string} key - The key or array-index of the current item
				 * @param {any} value - The value of the current item
				 * @returns {any} - Result of expression evaluation
				 * Evaluates the expression with the given context
				 */
				return function get(scope, key, value) {
					var locals = {};
					locals[comp.value] = value;
					if (comp.key !== undefined) {
						locals[comp.key] = key;
					}
					return parsed(scope, locals);
				};
			}

		}

		/**
		 * @function fillDefaults
		 * @private
		 * @param {object} comp - The parsed comprehension expression
		 * Fill defaults in parsed comprehension
		 */
		function fillDefaults(comp) {
			/* No {source} */
			if (!comp.source) {
				throw new Error('Source not specified or comprehension is invalid');
			}
			/* Only "{source}" */
			if (comp.value === undefined) {
				comp.value = 'item';
				comp.label = 'item.title';
				comp.select = 'item.value';
			}
			/* No "{select} as" */
			if (comp.select === undefined) {
				comp.select = comp.label;
			}
			/* No "track by {memo}" */
			if (comp.memo === undefined) {
				comp.memo = comp.select;
			}
		}

		/**
		 * @function testFillDefaults
		 * @private
		 * @param {string} expr - The expression to fill and return
		 * @returns {string} Expression with defaults filled in
		 *
		 * Parses an expression, fills in defaults, rebuilds expression to a
		 * string and returns it.
		 *
		 * If:
		 *   filled = testFillDefaults(expr)
		 * Then:
		 *   filled === testFillDefaults(filled)
		 */
		function testFillDefaults(expr) {
			var comp = compParser(expr);
			fillDefaults(comp);
			return _([
				comp.select,
				'as',
				comp.label,
				comp.group !== undefined ? ['group by', comp.group] : [],
				'for',
				comp.key !== undefined ?
					'(' + comp.key + ', ' + comp.value + ')' :
					comp.value,
				'in',
				comp.source,
				'track by',
				comp.memo
			]).flatten().join(' ');
		}

	}

})(window.angular, window._);
