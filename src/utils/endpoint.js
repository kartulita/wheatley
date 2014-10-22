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
	 * Query key/value object to URL query string
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

	function parametrizeRoute(route, params) {
		var paramRx = /(?:\/\:(\w+))(?=\/|$)/g;
		return route.replace(paramRx, function (all, key) {
			var value = params[key];
			// if (typeof value === 'undefined') {
			// 	throw new Error('Failed to parametrize route "' + route +
			// 		'": parameter "' + key + '" was not specified');
			// }
			if (value === null || typeof value === 'undefined') {
				return '';
			} else {
				return '/' + encodeURIComponent(value);
			}
		});
	}

	/* Returns the Endpoint constructor */
	function EndpointConstructor($http, toastService) {

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
			defineResource,
			/* Returns full URL */
			toString: toString
		};

		/* Hide internals if possible */
		if (Object.defineProperty) {
			Object.defineProperty(Endpoint.prototype, 'beginInvoke', { enumerable: false });
			Object.defineProperty(Endpoint.prototype, 'endInvoke', { enumerable: false });
		}

		/* Constructor */
		function Endpoint(name, options, parent) {
			if (!options) {
				throw new Error('Required parameter missing for Endpoint(name, options)');
			}
			var secure = options.secure || false;
			var path = options.path;
			var queryObj = options.query || {};
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
			this.queryObj = queryObj;
			var queryStr = queryToString(this.queryObj);
			/* Base URL (no query string) */
			this.baseUrl = (this.domainless ? '' : this.protocol + '://') +
				this.path;
			/* Full URL (with query string) */
			this.url = this.baseUrl + (queryStr.length > 0 ? '?' + queryStr : '');
			/* Parent endpoint */
			this.parent = parent || null;
			/* Invocation tracker */
			this.invokeCount = { any: 0, self: 0, child: 0 };
			/* Make the new endpoint immutable */
			Object.freeze(this);
		}

		function extend(name, path) {
			if (arguments.length !== 2) {
				throw new Error('Wrong number of parameters for ' +
					'endpoint.extend.  Did you forget to name the endpoint?');
			}
			return new Endpoint(name,
				{
					secure: this.secure,
					path: [this.path, path],
					query: this.queryObj
				}, this);
		}

		function query(name, query) {
			if (arguments.length !== 2) {
				throw new Error('Wrong number of parameters for ' +
					'endpoint.query.  Did you forget to name the endpoint?');
			}
			return new Endpoint(name,
				{
					secure: this.secure,
					path: this.path,
					query: _({}).extend(this.queryObj, query)
				}, this);
		}

		function invoke(method, data, config) {
			if (typeof method !== 'string') {
				throw new Error('Method must be a string');
			}
			data = data || {};
			/* Route parameters */
			var params = data.params;
			/* Query string */
			var query = data.query;
			/* Request payload */
			var body = data.body;
			/* URL */
			var url = parametrizeRoute(this.baseUrl, _({}).defaults(params, body));
			/* $http config */
			var fullConfig = {
				method: method,
				url: url,
				params: _({}).extend(this.queryObj, query),
				data: hasBody(method) ? body : undefined
			};
			if (config) {
				_(fullConfig).defaults(config);
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

		function hasBody(method) {
			return /^(PUT|POST|PATCH)$/i.test(method);
		}

		function invokeMethod(method) {
			return function (data, config) {
				return this.invoke(method, data, config);
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
			var name = Constructor.name;
			// if (!name) {
			// 	throw new Error('Resource constructor has no name');
			// }
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
			_(Constructor.prototype).extend(itemMethods);
			if (Object.defineProperty) {
				/* Hide extra instance methods if possible */
				for (var prop in itemMethods) {
					Object.defineProperty(Constructor.prototype, prop,
						{ enumerable: false, configurable: false });
				}
			}

			var defaultMethods = {
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
				return endpoint.get(params)
					.then(function (res) {
						return new Constructor(res.data, res);
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
					if (item.$isNew) {
						return endpoint.post(item)
							.then(function (res) { item.$isNew = false; });
					} else {
						return endpoint.put(item);
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
				return endpoint.delete(item)
					.then(function (res) {
						item.$deleted = true;
						return Object.freeze(item);
					});
			}

			function updateSelf() {
				return update(this);
			}

			function removeSelf() {
				return remove(this);
			}
		}

		return Endpoint;
	}

})(angular);
