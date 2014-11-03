(function (angular) {
	'use strict';

	angular.module('fields')
		.factory('directiveProxyService', directiveProxyService);

	function directiveProxyService($compile, $injector, _) {

		proxy.generateDirective = generateDirective;
		proxy.generateAlias = generateAlias;

		return proxy;

		/*
		 * proxy <=> directiveProxyService()
		 *
		 * target
		 *   name of element which we proxy to (must exist as directive)
		 * attrActions:
		 *   actions to take for various attributes, e.g.
		 *     {
		 *       'id': 'leave'         // Leave 'id' attribute on parent
		 *       'ng-model': 'move'    // Move 'ng-model' attribute to target
		 *       'class': 'copy'       // Copy 'class' attribute to target
		 *       'target': 'remove'    // Remove 'target' attribute
		 *     }
		 *   Default is 'move' for all attributes except 'class' and 'id', which
		 *   default to 'leave'.
		 *   If attrActions is an array, then assume 'leave' for all items in the
		 *   array.
		 * scope
		 *   scope to compile proxied directive in
		 * element
		 *   element which is proxying
		 * attrs
		 *   attributes of proxying element
		 */
		function proxy(target, attrActions, scope, element, attrs) {
			/* Ensure target exists (dependency check) */
			var targetName = target
				.replace(/[\s\-\:_]+\w/g, function (s) {
					return s.charAt(s.length - 1).toUpperCase();
				}) + 'Directive';
			try {
				$injector.get(targetName);
			} catch (e) {
				console.error('Target directive not found or could not be injected: ' + target);
				throw e;
			}
			/* Create new element */
			var forward = angular.element('<' + target + '/>');
			/* Parse attribute actions */
			if (!attrActions) {
				attrActions = {};
			} else if (attrActions instanceof Array) {
				attrActions = _(attrActions).reduce(function (memo, attr) {
					memo[attr] = 'leave';
					return memo;
				}, {});
			} else {
				attrActions = _(attrActions).clone();
			}
			if (!_(attrActions).has('class')) {
				attrActions['class'] = 'leave';
			}
			if (!_(attrActions).has('id')) {
				attrActions.id = 'leave';
			}
			/* Move attributes over */
			_(attrs).chain()
				.omit(function (val, key) { return key.charAt(0) === '$'; })
				.each(function (val, key) {
					var action = _(attrActions).has(key) ? attrActions[key] : 'move';
					if (action === 'remove' || action === 'move') {
						element.removeAttr(attrs.$attr[key]);
					}
					if (action === 'copy' || action === 'move') {
						forward.attr(attrs.$attr[key], val);
					}
				});
			/* Compile */
			$compile(forward)(scope);
			/* Append to parent */
			element.append(forward);
			return forward;
		}

		/* Generates a proxy directive to be returned by a directive */
		function generateDirective(tag, link, require) {
			return {
				restrict: 'E',
				require: require,
				terminal: true,
				priority: 1000000,
				replace: true,
				template: '<' + tag + '></' + tag + '>',
				link: link
			};
		}

		/* Generate an alias directive, within the given container */
		function generateAlias(tag, target) {
			return directiveProxyService.generateDirective(
				tag,
				function link(scope, element, attrs) {
					directiveProxyService(target, null, scope, element, attrs);
				});
		}

	}

})(window.angular);
