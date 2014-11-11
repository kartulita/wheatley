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
		.factory('Endpoint', EndpointFactory);

	var urlProtocolRx = /^(?:(\w+?):|(?=.))\/\//;
	var multiSlashRx = /\/{2,}/g;
	var routeParamRx = /(?:\/\:(\w+))(?=\/|$)/g;

	/*
	 * Returns first capture from applying regex to string, or a default value.
	 * Returns empty string for an empty (but successful) match.
	 */
	function getCapture(rx, str, default_) {
		var matches = str.match(rx);
		return (matches && matches.length > 1) ?
					_.isUndefined(matches[1]) ? '' :
					matches[1] :
					default_;
	}

	/*
	 * Mercilessly copied from angular-resource, this is more RFC-compliant
	 * than the JS encodeURIComponent function.  This encodes the URI path.
	 */
	function encodeURIQueryField(val, spacesAsHex) {
		return encodeURIComponent(val)
			.replace(/%40/g, '@')
			.replace(/%3A/gi, ':')
			.replace(/%24/g, '$')
			.replace(/%3C/gi, ',')
			.replace(/%20/g, spacesAsHex ? '%20' : '+');
	}

	/*
	 * Mercilessly copied from angular-resource, this is more RFC-compliant
	 * than the JS encodeURIComponent function.  This encodes the URI query key
	 * names and values.
	 */
	function encodeURIPathSegment(val) {
		return encodeURIQueryField(val, true)
			.replace(/%26/g, '&')
			.replace(/%3D/gi, '=')
			.replace(/%2B/gi, '+');
	}

	/*
	 * Convert key/value object to URL query string
	 */
	function convertObjectToQueryString(query) {
		return _(query)
			.map(function (val, key) {
				if (val === null) {
					val = '';
				} else if (val instanceof Date) {
					val = val.toISOString();
				} else if (val.toString === {}.toString) {
					throw new Error('Attempted to pass object as URI query parameter, ' +
						'but object does not implement toString');
				}
				return encodeURIQueryField(key) + '=' + encodeURIQueryField(val);
			})
			.join('&');
	}

	/*
	 * Replace parametrized parts of route with values
	 */
	function parametrizeRoute(route, params) {
		return route.replace(routeParamRx, function (all, key) {
			var value = params[key];
			// if (_(value).isUndefined()) {
			// 	throw new Error('Failed to parametrize route "' + route +
			// 		'": parameter "' + key + '" was not specified');
			// }
			if (value === null || _(value).isUndefined()) {
				return '';
			} else {
				return '/' + encodeURIPathSegment(value);
			}
		});
	}

	/*
	 * Convert an array of strings (and of other string arrays) to a path,
	 * by flattening the array and joining with slashes.
	 * Remove protocol and reduces double-slashes.
	 */
	function processPath(path) {
		if (_.isNull(path) || _.isUndefined(path)) {
			path = ''; /* Throw error */
		} else if (path instanceof Array) {
			path = _(path)
				.flatten()
				.map(String)
				.filter(function (str) { return str.length; })
				.join('/');
		} else {
			path = String(path);
		}
		if (path.length === 0) {
			throw new Error('No path specified for endpoint "' + name + '"');
		}
		/* Strip protocol from path */
		path = path.replace(urlProtocolRx, '');
		/* Reduce consecutive slashes to one */
		path = path.replace(multiSlashRx, '/');
		return path;
	}

	/*
	 * Determine which protocol has been requested, via the three different ways
	 * that the protocol may be specified.
	 */
	function processProtocol(options) {
		var path = options.path;
		var protoString = options.protocol;
		var secure = options.secure;
		var protoUrl = getCapture(urlProtocolRx, path, null);
		var protoOpt = _.isUndefined(protoString) ? null : String(protoString);
		var protoSec = _.isUndefined(secure) ? null : secure ? 'https' : 'http';
		var protocol = [protoUrl, protoOpt, protoSec]
			.reduce(function (protocol, test) {
				return (protocol === null && test !== null) ? test : protocol;
			}, null);
		if (protocol === null) {
			return protocol;
		}
		var protoNeq = function (proto) {
			return proto !== null &&
				protocol.toUpperCase() !== proto.toUpperCase();
		};
		if (protoNeq(protoOpt) || protoNeq(protoSec)) {
			throw new Error('Protocols specified in options.path / ' +
				'options.protocol / options.secure are inconsistent: ' +
				[protoUrl, protoOpt, protoSec]
					.map(function (s) {
						return s === null ? '(none)' :
							'"' + s.toUpperCase() + '"';
					})
					.join(', '));
		}
		return protocol;
	}

	/* Returns the Endpoint constructor */
	function EndpointFactory($http, $q, toastService) {

		Endpoint.prototype = {
			constructor: Endpoint,
			/*
			 * Returns new endpoint created by appending path
			 * e.g. creating an endpoint to some API routing by extending the
			 * API root path.
			 */
			extend: extend,
			/*
			 * Returns new endpoint created by extending query options
			 * e.g. adding an API key or auth token to the root URL for an API.
			 */
			query: query,
			/*
			 * Returns a new endpoint created by setting the value of a parameter
			 * in this endpoint.
			 */
			param: param,
			/* Invokes the target and returns a promise */
			invoke: invoke,
			/* Is this endpoint (or a child of it) being invoked? */
			isInvoking: isInvoking,
			/* Used internally for invoke tracker */
			beginInvoke: beginInvoke,
			endInvoke: endInvoke,
			/* Wraps invoke, with the given method */
			get: invokeMethod('GET'),
			post: invokeMethod('POST'),
			put: invokeMethod('PUT'),
			'delete': invokeMethod('DELETE'),
			head: invokeMethod('HEAD'),
			options: invokeMethod('OPTIONS'),
			/* A wrapper for the Endpoint, inspired by $resource */
			defineResource: defineResource,
			/* Returns full URL (parametrizing if a parameter is given) */
			toString: toString,
			parametrize: toString,
		};

		/* Hide internals if possible */
		if (Object.defineProperty) {
			Object.defineProperty(Endpoint.prototype, 'beginInvoke', { enumerable: false });
			Object.defineProperty(Endpoint.prototype, 'endInvoke', { enumerable: false });
		}

		return Endpoint;

		/* Constructor */
		function Endpoint(friendlyName, options, parent) {
			if (!options) {
				throw new Error('Required parameter missing for Endpoint(name, options)');
			}
			/* Set missing options to those of parent if parent is specified */
			if (parent) {
				options = _({}).defaults(options,
					{
						protocol: parent.protocol,
						path: parent.path,
						query: parent.query,
						params: parent.params
					});
			}
			if (typeof options === 'string') {
				options = {
					path: options
				};
			}
			/* Protocol */
			var protocol = processProtocol(options);
			var noProtocol = protocol === null;
			var sameProtocol = protocol === '';
			/* Path */
			var path = processPath(options.path);
			var secure = !noProtocol && protocol.toUpperCase() === 'HTTPS';
			/* Is path domainless? If yes, is it relative or absolute? */
			var relativePath = path.charAt(0) === '.';
			var absolutePath = path.charAt(0) === '/';
			var domainless = relativePath || absolutePath;
			if (!noProtocol && domainless) {
				throw new Error('Domain must be specified if protocol is ' +
					'non-null.  protocol="' + protocol + '", path="' + path +
					'"');
			}
			/* Query */
			var queryObject = Object.freeze(_.clone(options.query || {}));
			var queryString = convertObjectToQueryString(queryObject);
			/* Params */
			var paramObject = Object.freeze(_.clone(options.params || {}));
			/* Error handler */
			var errorHandler = !options.errorHandler ? defaultErrorHandler :
				(function (self, errorHandler) {
					return function () {
						try {
							return errorHandler.apply(self, arguments);
						} catch (err) {
							return defaultErrorHandler.apply(self, arguments);
						}
					};
				})(this, options.errorHandler);
			/* Store config */
			this.name = friendlyName;
			this.secure = secure;
			this.domainless = domainless;
			this.relative = relativePath;
			this.absolute = absolutePath || !this.domainless;
			this.protocol = protocol;
			this.path = path;
			this.query = queryObject;
			this.queryString = queryString;
			this.params = paramObject;
			/* Base URL (no query string) */
			this.baseUrl = (noProtocol ? '' : sameProtocol ? '//' : protocol + '://') + path;
			/* Full URL (with query string) */
			this.url = this.baseUrl + (queryString.length ? '?' + queryString : '');
			/* Parent endpoint */
			this.parent = parent || null;
			/* Invocation tracker */
			this.invokeCount = { any: 0, self: 0, child: 0 };
			/* Error handler */
			this.errorHandler = errorHandler;
			/* Make the new endpoint immutable */
			Object.freeze(this);
		}

		function extend(name, path) {
			var self = this;
			if (arguments.length === 1) {
				path = name, name = self.name;
			}
			var newPath = [self.path, path];
			return new Endpoint(name, { path: newPath }, self);
		}

		function param(name, key, value) {
			var self = this;
			if (arguments.length === 2) {
				value = key, key = name, name = self.name;
			}
			var newParam = {};
			newParam[key] = value;
			var newParams = _({}).extend(self.params, newParam);
			return new Endpoint(name, { params: newParams }, self);
		}

		function query(name, queryObj) {
			var self = this;
			if (arguments.length === 1) {
				queryObj = name, name = self.name;
			}
			var newQuery = _({}).extend(self.queryObj, queryObj);
			return new Endpoint(name, { query: newQuery }, self);
		}

		function defaultErrorHandler(error) {
			var self = this;
			toastService.error('Failed to communicate with ' +
				self.name + ': ' + (
					!error ? 'Unknown error' :
					typeof error === 'string' ? error :
					error.message));
			throw error;
		}

		function invoke(method, data, config) {
			var self = this;
			if (typeof method !== 'string') {
				throw new Error('Method must be a string');
			}
			data = data || {};
			/* Route parameters */
			var params = _({}).defaults(data.params, self.params);
			/* Query string */
			var query = data.query;
			/* Request payload */
			var body = data.body;
			/* URL */
			var url = self.toString(_({}).defaults(params, body));
			/* $http config */
			var fullConfig = {
				method: method,
				url: url,
				params: _({}).extend(self.queryObj, query),
				data: hasBody(method) ? body : undefined
			};
			if (config) {
				_(fullConfig).defaults(config);
			}
			/*
			 * Make $http request with error handler and begin/end invoke
			 * wrapper
			 */
			self.beginInvoke(true);
			return $http(fullConfig)
				.catch(self.errorHandler)
				.finally(function () {
					self.endInvoke(true);
				});
		}

		function hasBody(method) {
			return /^(PUT|POST|PATCH)$/i.test(method);
		}

		function invokeMethod(method) {
			return function (data, config) {
				return this.invoke(method, data, config);
			};
		}

		function beginInvoke(direct) {
			var self = this, parent = self.parent;
			self.invokeCount.any++;
			if (direct) {
				self.invokeCount.self++;
			} else {
				self.invokeCount.child++;
			}
			if (parent) {
				parent.beginInvoke(false);
			}
		}

		function endInvoke(direct) {
			var self = this, parent = self.parent;
			self.invokeCount.any--;
			if (direct) {
				self.invokeCount.self--;
			} else {
				self.invokeCount.child--;
			}
			if (parent) {
				parent.endInvoke(false);
			}
		}

		function isInvoking(directOnly) {
			var self = this;
			return (directOnly ? self.invokeCount.self : self.invokeCount.any) > 0;
		}

		function toString(params) {
			var self = this;
			if (arguments.length === 0) {
				return self.url;
			} else if (arguments.length === 1) {
				return parametrizeRoute(self.baseUrl, params);
			} else {
				throw new Error('Wrong number of parameters for ' +
					'endpoint.toString([params])');
			}
		}

		/* 
		 * Define a resource type
		 *
		 * `Constructor([data])`
		 *   Constructs a default (new) item, optionally assigning some values
		 *   to non-defaults if `data` object is specified.
		 *
		 * `Constructor(data, response)`
		 *   Constructs an item from the `data` received from the server, from
		 *   the given [response].  `data === JSON.parse(response.data)`.
		 *
		 * The returned object has the following methods:
		 *   `create([data])`: Create a new item (no HTTP request)
		 *   `read(params)`: Load an existing item (HTTP GET)
		 *   `update(item)`: Save an item (HTTP POST/PUT)
		 *   `delete(item)`: Delete an item (HTTP DELETE)
		 *
		 * `create` does not result in a POST, instead you must call `update` or
		 * `item.save`.  This is because in most use cases, a new item will be
		 * configured/initialized a bit before being saved.
		 *
		 * `update` uses `POST` for a new item, and `PUT` for an existing item.
		 * An item is considered "new" if it was returned by `create` and has
		 * not been (successfully) saved yet.  This is achieved via the hidden
		 * `$isNew` property on each item, which is set only in `create`, and is
		 * unset only on a successful save.
		 *
		 * `delete` and its synonyms freeze the object if the delete is
		 * successful, and set the hidden `$deleted` property of the item to
		 * true.
		 *
		 * `Constructor.preUpdate(item)` is an optional function which if exists,
		 * is called by `save` before the save is initiated.  It must either
		 * return falsy, or a promise.  If a promise is returned, then the save
		 * is initiated when the promise is resolved, otherwise the save is
		 * initiated immediately after preUpdate returns.  If a rejected promise
		 * is returned by preUpdate, the save is not initiated.
		 *
		 * `Constructor.postUpdate(item, data, response)` is an optional function
		 * which if exists, is called by `save` after a save request has
		 * completed.  It must either return falsy or a promise.  If a
		 * `postUpdate` method is not specified, then the default is used,
		 * which merges any fields of `data` into `item` via `_.extend`.
		 */
		function defineResource(Constructor, extraMethods) {
			var endpoint = this;
			/* 
			 * Methods added to instances.  Unsure whether $ prefix is good idea,
			 * maybe use _ instead?  Something to avoid potential clashes with
			 * field names.
			 */
			var itemMethods = {
				$save: updateSelf,
				$delete: removeSelf,
				$remove: removeSelf,
				$isNew: true,
				$deleted: false
			};
			if (extraMethods) {
				_(itemMethods).extend(extraMethods);
			}
			itemMethods.prototype = Constructor.prototype;
			Constructor.prototype = itemMethods;
			if (Object.defineProperty) {
				/* Hide extra instance methods if possible */
				for (var prop in itemMethods) {
					Object.defineProperty(Constructor.prototype, prop,
						{ enumerable: false, configurable: false });
				}
			}

			function EndpointResource() {
				throw new Error('Cannot call constructor directly, use ' +
					'endpoint.defineResource instead');
			}

			var defaultMethods = {
				constructor: EndpointResource,
				endpoint: endpoint,
				/* CRUD */
				create: create,
				read: read,
				update: update,
				'delete': remove,
				/* Aliases */
				'new': create,
				load: read,
				get: read,
				save: update,
				remove: remove
			};
			return _({}).extend(defaultMethods, extraMethods || {});
			
			function create() {
				return new Constructor();
			}

			function read(params) {
				return endpoint.get({ params: params })
					.then(function (res) {
						var item = new Constructor(res.data, res);
						item.$isNew = false;
						return item;
					});
			}

			function update(item) {
				if (item.$deleted) {
					throw new Error('Attempted to save an item which has ' +
						'been deleted');
				}
				return doPreUpdate()
					.then(doUpdate)
					.then(doPostUpdate)
					.then(function () { return item; });
				/* Optional pre-update */
				function doPreUpdate() {
					if (Constructor.preUpdate) {
						return constructor.preUpdate(item) || $q.when();
					} else {
						return $q.when();
					}
				}
				/* Update */
				function doUpdate() {
					if (item.$deleted) {
						throw new Error('Attempted to save an itel that has ' +
							'been deleted');
					}
					var saveItem = _(item)
						.omit(function (v, k) { return k.charAt(0) === '$'; });
					if (item.$isNew) {
						return endpoint.post({ body: saveItem })
							.then(function (res) {
								item.$isNew = false;
								return res;
							});
					} else {
						return endpoint.put({ body: saveItem });
					}
				}
				/* Optional post-update */
				function doPostUpdate(res) {
					if (Constructor.postUpdate) {
						return Constructor.postUpdate(item, res.data, res) ||
							$q.when(item);
					} else {
						_(item).extend(res.data);
						return $q.when(item);
					}
				}
			}

			function remove(item) {
				return endpoint.delete({ body: item })
					.then(function () {
						item.$deleted = true;
						return Object.freeze(item);
					});
			}

			function updateSelf() {
				var self = this;
				return update(self);
			}

			function removeSelf() {
				var self = this;
				return remove(self);
			}
		}
	}

})(window.angular);
