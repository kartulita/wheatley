(function (angular) {
	'use strict';

	angular.module('api')
		.constant('apiConfigs', {
			common: {
				secure: true,
				path: '/'
			},
			dev: {
				domain: 'api.uriel.err.ee'
			},
			live: {
				domain: 'api.err.ee'
			}
		})
		.constant('apiMode', 'dev')
		.factory('apiConfig', apiConfig)
		;

	function apiConfig(apiConfigs, apiMode) {
		return $({}).extend(apiConfigs.common, apiConfigs[apiMode]);
	}

})(angular);
