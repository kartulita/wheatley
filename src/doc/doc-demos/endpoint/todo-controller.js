
angular.module('todoApp')
	.controller('todoController', todoController)
	.factory('busyTrackerInterceptor', busyTrackerInterceptor)
	.config(function ($httpProvider) {
		$httpProvider.interceptors.push('busyTrackerInterceptor')
	});

/*
 * Could also check isInvoking() on api endpoint, which would probably be
 * better since requests from other parts of the application would then be
 * ignored.
 */
function busyTrackerInterceptor($q, $rootScope) {
	var requestCount = 0;

	return {
		request: onRequest,
		response: onResponse,
		responseError: onResponseError
	};

	function requestStarted() {
		if (requestCount++ === 0) {
			$rootScope.$broadcast('busy', true);
		}
	}

	function requestEnded() {
		if (--requestCount === 0) {
			$rootScope.$broadcast('busy', false);
		}
	}

	function onRequest(config) {
		requestStarted();
		return config || $q.when(config);
	}

	function onResponse(response) {
		requestEnded();
		return response || $q.when(response);
	}

	function onResponseError(response) {
		requestEnded();
		return $q.reject(response);
	}
}

function todoController($scope, $rootScope, todoService) {
	var vm = $scope;

	vm.isBusy = false;

	vm.methods = {
		dump: todoService.dump
	};

	$rootScope.$on('busy', function (event, busy) { vm.isBusy = busy; });
}

