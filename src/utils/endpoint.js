(function () {
	'use strict';

	/*
	 * Wraps REST endpoints in an immutable object with get/put/post/del methods
	 * to initiate requests.  Hooking into the extend or invoke methods will
	 * allow monitoring of all end-points that are requested by the application,
	 * and requests that they initiate.
	 */
	angular.module('utils')
		.factory('Endpoint', EndpointConstructor);

	/*
	 * Endpoint class
	 *
	 * Constructor parameters:
	 *  * name: human/debug friendly name for the endpoint
	 *  * secure: use HTTPS?
	 *  * target: path to append to API_PATH
	 *  * query : query string or dictionary.  No leading '?'
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
	 *   toastService.error('Failed to communicate with photos service: <ERROR>');
	 */

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

	/* Returns the Endpoint constructor */
	function EndpointConstructor($http, toastService) {

		Endpoint.prototype = {
			constructor: Endpoint,
			/* Returns new endpoint created by appending path */
			extend: extend,
			/* Returns new endpoint created by extending query */
			query: query,
			/* Invokes the target and returns a promise */
			invoke: invoke,
			/* Wraps invoke, with the given method */
			get: invokeMethod('GET'),
			post: invokeMethod('POST'),
			put: invokeMethod('PUT'),
			del: invokeMethod('DELETE'),
			'delete': invokeMethod('DELETE'),
			head: invokeMethod('HEAD'),
			options: invokeMethod('OPTIONS'),
			/* Returns full URL */
			toString: toString
		};

		/* Constructor */
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
			this.protocol = this.secure ? 'https' : 'http';
			this.path = path.length ? cleanPath(path) : '';
			this.queryObj = queryObj || {};
			var queryStr = queryToString(this.queryObj);
			/* Base URL (no query string) */
			this.baseUrl = this.protocol + '://' + this.path;
			/* Full URL (with query string) */
			this.url = this.base + (queryStr.length > 0 ? '?' + queryStr : '');
			/* Make the new endpoint immutable */
			Object.freeze(this);
		}

		function extend(name, path) {
			if (arguments.length !== 3) {
				throw new Error('Wrong number of parameters for endpoint.extend');
			}
			if (path === null) {
				path = '';
			}
			return new Endpoint(name || this.name, this.secure,
				[this.path, path], this.queryObj);
		}

		function query(name, query) {
			return new Endpoint(name || this.name, this.secure, this.path,
				_({}).extend(this.queryObj, queryObj || {}));
		}

		function invoke(method, data, config) {
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
					toastService.error('Failed to communicate with ' + self.name + ': ' + error.message);
					throw error;
				});
		}

		function invokeMethod(method) {
			return function (data, config) {
				return this.invoke(method, data, config);
			};
		}

		function toString() {
			return this.url;
		}

		return Endpoint;
	}

}());
