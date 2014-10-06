(function () {
'use strict';

	/* Defines base endpoint for the API */
	angular.module('apiModule')
		.factory('apiEndpoint', function (Endpoint, USE_HTTPS, API_DOMAIN, API_PATH) {
			return new Endpoint('API base', USE_HTTPS, [API_DOMAIN, API_PATH]);
		});

}());
