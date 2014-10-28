(function (angular) {
'use strict';

	/* Defines base endpoint for the API */
	angular.module('api')
		.factory('api', apiEndpoint);

	function apiEndpoint(Endpoint, apiConfig) {
		return new Endpoint('API base',
			{
				secure: apiConfig.secure,
				path: [apiConfig.domain, apiConfig.path]
			});
	}

})(angular);
