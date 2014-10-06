(function () {
'use strict';

	/* Remove leading/trailing/double slashes */
	function cleanPath(path) {
		return path.replace(/(^\/+|\/+$)/g, '').replace(/\/{2,}/g, '/');
	}

	/*
	 * Query object to string (used only by Endpoint.url)
	 */
	function queryToString(query) {
		return _(query).pairs()
			.map(function (pair) {
				var key = pair[0], val = pair[1];
				if (val === null) {
					val = '';
				} else if (val.toString === {}.toString) {
					throw new Error('Attempted to pass object as URI query parameter, ' +
						'but object does not implement toString');
				}
				return encodeURIComponent(key) + '=' + encodeURIComponent(val);
			})
			.join('&');
	}

	/*
	 * Wraps REST endpoints in an immutable object with get/put/post/del methods
	 * to initiate requests.  Hooking into this service will allow monitoring of
	 * all end-points that are requested by the application.
	 */
	angular.module('backend')
		.factory('Endpoint', function (API_DOMAIN, API_PATH, $http, toast) {
			/*
			 * Endpoint class
			 *
			 * secure: use HTTPS?
			 * target: path to append to API_PATH
			 * query : query string or dictionary.  No leading '?'
			 *
			 * Returns an endpoint (immutable):
			 *  * name: Human-friendlyname [string]
			 *  * secure: Use HTTPS? [bool]
			 *  * path: Path of target (incl, domain if not extending an endpoint) [string]
			 *  * extend('name', path): create new endpoint by appending given path
			 *  * query('name', query): create new endpoint by merging given query object
			 *  * endpoint.get(): promise
			 *  * endpoint.post(data): promise
			 *  * endpoint.put(data): promise
			 *  * endpoint.del(): promise
			 *  * endpoint.invoke(method [, data [, config] ])
			 *
			 * var base = new Endpoint('API base', true, ['acme.inc', 'api']);
			 * base.url === 'https://acme.inc/api'
			 *
			 * var base = new Endpoint('API base', true, 'acme.inc/api');
			 * base.url === 'https://acme.inc/api'
			 *
			 * var users = base.extend('users service', 'user', { uid: 12 })
			 * users.url === 'https://acme.inc/api/user?uid=12'
			 *
			 * var photos = e.extend('photos service', 'photo', { pid: 400 });
			 * photos.url === 'https://acme.inc/api/user/photo?uid=12&pid=400'
			 *
			 * photos.get() => promise
			 * If operation fails, toastService is called:
			 *   toast.error('Failed to communicate with photos service: <ERROR>');
			 */
			function Endpoint(name, secure, path, queryObj) {
				if (arguments.length !== 4 && arguments.length !== 3) {
					throw new Error('Parameter count for `new Endpoint` is incorrect');
				}
				if (path === null) {
					path = '';
				} else if (path instanceof Array) {
					path = _(path).flatten().join('/');
				} else {
					path = String(path);
				}
				this.name = name;
				this.secure = secure;
				this.protocol = this.secure ? 'https' : 'http;
				this.path = path.length ? cleanPath(path) : '';
				this.queryObj = queryObj || {};
				var queryStr = queryToString(this.queryObj);
				/* Base URL (no query string) */
				this.baseUrl = this.protocol + '://' + this.path;
				/* Full URL (with query string) */
				this.url = this.base + (queryStr.length > 0 ? '?' + queryStr : '');
				/* Make new endpoint immutable */
				Object.freeze(this);
			}

			Endpoint.prototype = {
				/* Returns new endpoint created by appending path */
				extend: function (name, path) {
					if (arguments.length !== 3) {
						throw new Error('Wrong number of parameters for endpoint.extend');
					}
					if (path === null) {
						path = '';
					}
					return new Endpoint(name || this.name, this.secure,
						[this.path, path],
						this.queryObj);
				},
				/* Returns new endpoint created by extending query */
				query: function (name, query) {
					return new Endpoint(name || this.name, this.secure, this.path,
						_({}).extend(this.queryObj, queryObj || {}));
				},
				/* Returns full URL */
				toString: function () { return this.url; },
				/* Invokes the target and returns a promise */
				invoke: function (method, data, config) {
					var fullConfig = {
						method: method, url: this.baseUrl, params: this.queryObj,
						data: data
					};
					if (config) {
						_(fullConfig).extend(config);
					}
					var self = this;
					return $http(fullConfig)
						.catch(function (error) {
							toast.error('Failed to communicate with ' + self.name + ': ' + error.message);
							throw error;
						});
				},
				get: function () { return this.invoke('GET'); },
				post: function (data) { return this.invoke('POST', data); },
				put: function (data) { return this.invoke('PUT', data); },
				del: function () { return this.invoke('DELETE'); }
				/* */
			};

			return Endpoint;
		});

}());
