(function (angular, window) {

	window.countWatchers = countWatchers;
	window.logWatchers = logWatchers;

	logWatchers();

	return;

	function logWatchers(element) {
		setInterval(function () { countWatchers(element); }, 2000);
	}

	function countWatchers(element) {
	    var app = element || document.getElementsByTagName('body');
	    var watchers = [];
		var total = 0;
		var unique = 0;

		recurse(app);

		console.info('Total watchers: ' + total, 'Unique watchers: ' + unique);

		return {
			total: total,
			unique: unique
		};

		function recurse(element) {
			element = angular.element(element);
			angular.forEach(['$scope', '$isolateScope'], function (scope) { 
				var data = element.data();
				if (data && data.hasOwnProperty(scope)) {
					angular.forEach(data[scope].$$watchers, function (watcher) {
						total++;
						if (watchers.indexOf(watcher) === -1) {
							watchers.push(watcher);
							unique++;
						}
					});
				}
			});
			angular.forEach(element.children(), recurse);
		};
	}

})(window.angular, window);
