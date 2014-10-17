(function (angular) {
	'use strict';

	/*
	 * Wraps REST endpoints in an immutable object with get/put/post/del methods
	 * to initiate requests.  Hooking into the extend or invoke methods will
	 * allow monitoring of all end-points that are requested by the application,
	 * and requests that they initiate.
	 *
	 * Automatically toasts an error if a request fails.
	 */
	angular.module('utils')
		.factory('Endpoint', EndpointConstructor);

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
			/* Is this endpoint or a child of it being invoked? */
			isInvoking: isInvoking,
			/* Used internally for invoke tracker */
			beginInvoke: beginInvoke,
			endInvoke: endInvoke,
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

		if (Object.defineProperty) {
			Object.defineProperty(Endpoint.prototype, 'beginInvoke', { enumerable: false });
			Object.defineProperty(Endpoint.prototype, 'endInvoke', { enumerable: false });
		}

		/* Constructor */
		function Endpoint(name, secure, path, queryObj, parent) {
			if (arguments.length > 5 || arguments.length < 3 ||
					typeof name !== 'string' || typeof secure !== 'boolean' ||
					(typeof path !== 'string' && !(path instanceof Array))) {
				throw new Error('Parameter count/type for Endpoint constructor is ' +
					'incorrect.  Expect: name secure path [queryObj]');
			}
			/* Process path */
			var pathStart;
			if (path instanceof Array) {
				var firstPart = path.join('');
				if (firstPart.length === 0) {
					throw new Error('No path specified for endpoint "' + name + '"');
				}
				pathStart = firstPart.charAt(0);
				path = _(path).flatten().join('/');
			} else {
				path = String(path);
				pathStart = path.charAt(0);
			}
			/* Is domainless? */
			var domainless = '/.'.indexOf(pathStart) !== -1;
			var relative = pathStart === '.';
			var absolute = pathStart === '/';
			if (secure && domainless) {
				throw new Error('Domain must be specified if endpoint uses ' +
					'HTTPS');
			}
			/* Store config */
			this.name = name;
			this.secure = secure;
			this.domainless = domainless;
			this.protocol = this.domainless ? null :
				this.secure ? 'https' : 'http';
			this.path = (domainless && absolute ? '/' : '') + (path.length ? cleanPath(path) : '');
			this.queryObj = queryObj || {};
			var queryStr = queryToString(this.queryObj);
			/* Base URL (no query string) */
			this.baseUrl = (this.domainless ? '' : this.protocol + '://') +
				this.path;
			/* Full URL (with query string) */
			this.url = this.baseUrl + (queryStr.length > 0 ? '?' + queryStr : '');
			/* Parent endpoint */
			this.parent = parent;
			this.invokeCount = { any: 0, self: 0, child: 0 };
			/* Make the new endpoint immutable */
			Object.freeze(this);
		}

		function extend(name, path) {
			if (arguments.length !== 2) {
				throw new Error('Wrong number of parameters for ' +
					'endpoint.extend.  Did you forget to name the endpoint?');
			}
			if (path === null) {
				path = '';
			}
			return new Endpoint(name || this.name, this.secure,
				[this.path, path], this.queryObj, this);
		}

		function query(name, query) {
			if (arguments.length !== 2) {
				throw new Error('Wrong number of parameters for ' +
					'endpoint.query.  Did you forget to name the endpoint?');
			}
			return new Endpoint(name || this.name, this.secure, this.path,
				_({}).extend(this.queryObj, queryObj || {}), this);
		}

		function invoke(method, params, data, config) {
			if (typeof method !== 'string') {
				throw new Error('Method must be a string');
			}
			/* Parametrize route */
			var url = this.baseUrl.replace(/\:(\w+)/, function (all, key) {
				var value = params[key];
				if (typeof value === 'undefined') {
					throw new Error('Endpoint parameter missing: "' + key + '"');
				}
				return encodeURIComponent(value);
			});
			/* $http config */
			var fullConfig = {
				method: method,
				url: url,
				params: this.queryObj,
				data: method.toUpperCase() === 'GET' ? undefined : data
			};
			if (config) {
				_(fullConfig).extend(config);
			}
			var self = this;
			self.beginInvoke(true);
			return $http(fullConfig)
				.catch(function (error) {
					toastService.error('Failed to communicate with ' +
						self.name + ': ' + (
							!error ? 'Unknown error' :
							typeof error === 'string' ? error :
							error.message));
					throw error;
				})
				.finally(function () {
					self.endInvoke(true);
				});
		}

		function invokeMethod(method) {
			return function (params, data, config) {
				return this.invoke(method, params, data, config);
			};
		}

		function beginInvoke(direct) {
			this.invokeCount.any++;
			if (direct) {
				this.invokeCount.self++;
			} else {
				this.invokeCount.child++;
			}
			if (this.parent) {
				this.parent.beginInvoke(false);
			}
		}

		function endInvoke(direct) {
			this.invokeCount.any--;
			if (direct) {
				this.invokeCount.self--;
			} else {
				this.invokeCount.child--;
			}
			if (this.parent) {
				this.parent.endInvoke(false);
			}
		}

		function isInvoking(directOnly) {
			return (directOnly ? this.invokeCount.self : this.invokeCount.any) > 0;
		}

		function toString() {
			return this.url;
		}

		return Endpoint;
	}

})(angular);
