# Naming

## Annotations

Let ng-annotate handle the injector annotations.  Don't specify them yourself,
since this results in repetition of code - which is an ugly anti-pattern.

Bad:

    angular.module('annotated', []);

	/*
	 * If the dependencies for the controller change, we have to make the change
	 * in two places, and ensure that we preserve the order.  ANTI-PATTERN!
	 */
	angular.module('annotated')
		.controller('baseController', ['$scope', baseController])
		.controller('otherController', ['$scope', '$rootScope', '$http', otherController])
		;

	function baseController($scope) {
	}

	function otherController($scope, $rootScope, $http) {
	}

Good:

	angular.module('notAnnotated', []);

	/* Let ng-annotate create the annotations automatically before we minfiy */
	angular.module('notAnnotated')
		.controller('baseController', baseController)
		.controller('otherController', otherController)
		;

	function baseController($scope) {
	}

	function otherController($scope, $rootScope, $http) {
	}

When chaining functions, the trailing semicolon can be on the last line or on
a line of its own, I don't really care.  The dot however MUST ALWAYS be at the
start of a line:

	angular.module('example', []);

	angular.module('example')
		.constant('Dot at', 'start')
		;

	angular.module('example')
		constant('Do not do this', null).  <-- None of this crap
		constant('It looks', 'idiotic').
		constant('like', 'coffeescript');

## Modules

Modules have camelCased names.  Declare the module and its dependencies in
`modules.js` (see `BUILD`):

    angular.module('nameConventions', []);

Then get the module in other files:

	angular.module('nameConventions')
		.controller('myController', myController);

## Constructors

Constructors have uppercase first letter as usual:

    angular.module('nameConventions')
		.value('MyClass', MyClass)
		.factory('MyOtherClass', MyOtherClassConstructor);

## Separate declarations from definitions

Declarations come first (with documentation), definitions appear later:

	/* Simple class, exported via module.value */
    function MyClass(value) {
		/* Declarations first */

		/* Gets the value */
		this.getValue = getValue;

		/* Definitions last.  Documentation goes with the declaration. */
		function getValue() {
			return value;
		}
	}

Define functions using `function` rather than the initializer syntax.  This way,
the order of definitions is unimportant.

	/* Configured class, exported via module.factory */
	function MyOtherClassConstructor($http) {

		/* Declarations first.  Document them. */
		MyOtherClass.prototype = {
			/* Gets the value */
			getValue: getValue,
			/* Gets the item */
			getItem: getItem
		};

		function MyOtherClass(value) {
			this.myClass = new MyClass(value);
		}

		function getItem() {
			var params = {
				/*
				 * We avoided initializer syntax, so it doesn't matter that we
				 * haven't defined getValue yet.
				 */
				item: this.getValue();
			};
			return $http.get('/api', { params: params });
		}

		function getValue() {
			return this.myClass.getValue();
		}

		return MyOtherClass;
	}

## Constants

Constant values are namespaced, lowercase, with underscores between words
(snake-case).  Actually, I may have broken this a few times, maybe just follow
the camelCase convention used for everything else (but keep namespacing).

    angular.module('bools', []);

	angular.module('bools')
		.value('bools_true', true)
		.factory('bools_false', bools_false);

	function bools_false() {
		return false;
	}
    
## Services

Services have camelCased names which end with `Service`:

	angular.module('iPhone', []);

	angular.module('iPhone')
		.service('nsaService', nsaService)
		.service('gotoFailService', gotoFailService)
		.factory('refreshTabsForNoReasonService', refreshTabsForNoReasonService);

	function nsaService($nsa, $personalData) {

		this.update = sendPersonalDataToNSA;

		function sendPersonalDataToNSA() {
			$nsa.send($personalData);
		}
	}

	function gotoFailService() {
		/* TODO: include https://github.com/mattdiamond/fuckitjs */
	}

	function refreshTabsForNoReasonService($interval) {
		var timer;

		return {
			start: start,
			stop: stop
		};

		function refreshTabs() {
			/* TODO */
		}

		function start() {
			timer = timer || $interval(refreshTabs, 60000);
		}

		function stop() {
			$interval.cancel(timer);
			time = undefined;
		}
	}
