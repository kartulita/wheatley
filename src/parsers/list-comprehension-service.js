(function (angular, _) {
	'use strict';

	angular.module('parsers')
		.factory('listComprehensionService', listComprehensionService);

	/*
	 * Parses list comprehensions and returns an object which can be used to
	 * interrogate lists.
	 */
	function listComprehensionService($parse, comprehensionService) {
		var compSyntax = '[{select} as] {label} [group by {group}] for [({key}, {value})|{value}] in {source} [track by {memo}]|{source}';
		var compParser = comprehensionService(compSyntax);

		/* Expose extra functions if Chai is detected */

		if (window.expect || Object.prototype.should) {
			comprehend.test = {
				compile: function () {
					return comprehensionService(compSyntax);
				},
				parse: function (expr) {
					return compParser(expr);
				},
				fillDefaults: testFillDefaults
			};
		}

		return comprehend;

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
				group: get(comp.group),
				label: get(comp.label),
				select: get(comp.select),
				memo: get(comp.memo),
			};

			return interrogate;

			/* Gets the items in a normalized form */
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

				/* Underlying dataset changed */
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

			/*
			 * Gets the items from the source and maps them as specified by
			 * the comprehension expression
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

			/*
			 * Returns a function that evaluates an expression.  The resulting
			 * function takes the following parameters: scope, key, value
			 */
			function get(expr) {
				var parsed = $parse(expr);
				return function (scope, key, value) {
					var locals = {};
					locals[comp.value] = value;
					if (comp.key !== undefined) {
						locals[comp.key] = key;
					}
					return parsed(scope, locals);
				};
			}

		}

		/* Fill defaults in pasred comprehension */
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
		
		/* Parse an expression, fill defaults, return new expression */
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
