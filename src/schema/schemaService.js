(function (angular) {
'use strict';

	angular.module('apiModule', [])
		.factory('schemaService', function (apiEndpoint) {
			var endpoint = apiEndpoint.extend('schema service', '/schema');
			return {
				get: function (schemaName) {
					return endpoint.query({ name: schemaName }).get();
				}
			};
		});

})(angular);
