
angular.module('todoApp')
	.constant('appConfig', {
		mode: 'test',
		common: {
			api: '/api',
			params: { apiKey: 42 }
		},
		production: {
			https: true,
			server: 'myapp.ee'
		},
		test: {
			https: false,
			server: ''
		}
	})
	.factory('apiEndpoint', apiEndpoint);

function apiEndpoint(Endpoint, appConfig) {
	/*
	 * Creates root endpoint from which others extend.
	 */
	var config = _({}).defaults(appConfig[appConfig.mode], appConfig.common);
	return new Endpoint('Todo API', config.https,
		[config.server, config.api], config.params);
}

