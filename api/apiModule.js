(function () {
'use strict';

	/* Defines the module for API access.  Endpoint defined in apiEndpoint.js */
	angular.module('apiModule', [])
		.constant('API_DOMAIN', 'api.err.ee')
		.constant('API_PATH', '/')
		.constant('USE_HTTPS', false);

}());

