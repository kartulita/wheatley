(function (angular) {
'use strict';

	/* Defines base endpoint for the API */
	angular.module('api')
		.factory('api_endpoint', api_endpoint);

	/* Returns an endpoint which can be extended to create new endpoints */
	function api_endpoint(Endpoint, api_https, api_domain, api_path) {
		return new Endpoint('API base', api_https, [api_domain, api_path]);
	}

})(angular);
