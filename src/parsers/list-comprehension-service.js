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
			var listGetter = $parse(comp.source);
			/* Parse expressions and store accessor functions */
			var params = {
				group: get(comp.group),
				label: get(comp.label),
				select: get(comp.select),
				memo: get(comp.memo),
			};
			return getItems;
			/* Gets the items in a normalized form */
			function getItems(scope) {
				var list = listGetter(scope);
				var items = _(list).map(function (value, key) {
					return {
						select: params.select(key, value),
						label: params.label(key, value),
						memo: params.memo(key, value),
						group: params.group(key, value),
						key: key,
						value: value
					};
				});
				items.invalid = false;
				items.oninvalidate = null;
				scope.$watch(comp.source, function () {
					items.invalid = true;
					if (items.oninvalidate) {
						items.oninvalidate();
					}
				});
				return items;
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
