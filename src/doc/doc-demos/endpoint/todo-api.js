
angular.module('todoApp')
	.constant('apiMode', 'test')
	.constant('apiConfigs', {
		common: {
			query: { apiKey: 42 }
		},
		production: {
			secure: true,
			path: 'myapp.ee/api'
		},
		test: {
			secure: false,
			path: 'dev-server:1337/api'
		}
	})
	.factory('apiConfig', apiConfig)
	.factory('rootApi', rootApi);

function apiConfig(apiConfigs, apiMode) {
	return _({}).extend(apiConfigs.common, apiConfigs[apiMode]);
}

function rootApi(Endpoint, apiConfig) {
	/* Creates root endpoint from which others extend */
	return new Endpoint('Todo API', apiConfig);
}

