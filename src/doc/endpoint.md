# Utils

Miscallaneous utilities

## Endpoint

Angular's $resource has some minor drawbacks:

 * No support for `PUT` method.  We use the same method for both `create` and for
   `update`.  I like APIs to be explicit, it makes testing and debugging easier.

 * I wanted to add an automatic error handler, which toasts an error to the user.
   This could also be done using HTTP interceptors, but they feel like a bit of a
   monkey-patch.  I want this to be per-API too, so the error message has the
   name of the respective API to aid debugging.  This in turn requires APIs to
   have a name associated with them (naming is mandatory in Endpoint).

 * I wanted a way to track when requests are active to some API (or a sub-API),
   in order to disable a set of browser elements relating to some API whenever a
   request to that API was active.  I wanted this to be automatic, rather than
   requiring `beginRequest(...) .then(...) .finally(... endRequest)` on every
   call.  This means I can disable `save` buttons while a save is active, in
   order to prevent double-saves (particularly for new items, since this would
   result in duplicates), and also to disable the editor fields and optional
   `new item` buttons, since if a save fails I want the user to be able to try
   again rather than losing their data due to clicking `new` without realising
   that their previous object hadn't completed saving.

Additionally, I wanted the URI building to be modular and hierarchical - so the
base API path is stored in one place, and changing it there will automatically
update all API calls.  This allows the entire app to easily switch between TEST
and PRODUCTION modes, just by changing the API root URL - or a global boolean
which is used to choose the API root URL.  Endpoints effectively inherit from
each other, so rather than having:

	GET https://api.fancy-tech-startup.com/social/user/search?commonparam=112358&name=elon+musk
	GET https://api.fancy-tech-startup.com/social/user/693147?commonparam=112358
	PUT https://api.fancy-tech-startup.com/social/photo/31415926?commonparam=112358
	POST https://api.fancy-tech-startup.com/social/photo?commonparam=112358

which looks semi-nice until you realise that the domain needs to be changed (or
some other common piece of information), we can have:

	angular.module('myApp', ['utils']);
	
	angular.module('myApp')

		/* Define API targets */
		.constant('apiConfigs', {
			'test': {
				https: false,
				path: 'local-dev-server:49001/api',
				query: { commonparam: 112358 }
			},
			'live': {
				https: true,
				path: 'api.fancy-tech-startup.com',
				query: { commonparam: 112358 }
			}
		})

		/* Define which API target to use */
		.constant('apiMode', 'test')

		/* API config selector */
		.factory('apiConfig', function (apiConfigs, apiMode) {
			return apiConfigs[apiMode];
		})

		/* Base endpoint which others extend from */
		.factory('baseApi', function (Endpoint, apiConfig) {
			return new Endpoint('base API', apiConfig);
		})

		/* API for our social app */
		.factory('socialApi', function (baseApi) {
			return baseApi.extend('social API', 'social');
		})

		/* API for users */
		.factory('userApi', function (socialApi) {
			return socialApi.extend('user API', 'user')
		})

		/* API for photos */
		.factory('photoApi', function (socialApi) {
			return socialApi.extend('photo API', 'photo')
		})

		/* Run block to demonstrate generating the previously listed requests */
		.run(function (userApi, photoApi) {
			userApi.get({ query: { name: 'elon musk' } }).then(...);
			userApi.get({ params: { id: 693147 } }).then(...);

			var photoData = { id: 31415926, name: 'Beach party' };
			photoApi.put({ body: photoData }).then(...);

			var photoData = { name: 'Dungeon party', photo: photoUrl, user: 142857 };
			photoApi.post({ body: postData })
				.then(function (response) {
					photoData.id = response.data.id;
				})
				.then(...);
		})

		/* Let's also demonstrate a $resource-inspired pattern too */

		.factory('searchApiMethod', function () {
			/*
			 * Shareable definition for the "search" method which may be added
			 * to APIs.  By defining common API routines externally, then
			 * refrencing them in endpoint.defineResource, we may create
			 * "contracts".  The contract describes the API methods on the
			 * backend, not the names that the resources expose them as.
			 */
			return function (query) {
				/* `this` is return value of endpoint.defineResource */
				return this.endpoint.get(
					{
						params: { id: 'search' },
						query: query
					});
			};
		})

		.factory('users', function (userApi, searchApiMethod) {
			return userApi.defineResource(User, { search: searchApiMethod });

			function User(data) {
				data = data || { name: '', email: '' };
				this.name = data.name;
				this.email = data.email;
			}
		})

		.factory('photos', function (photoApi, searchApiMethod) {
			return photoApi.defineResource(User, { search: searchApiMethod });

			function Photo(data) {
				data = data || { name: '', photo: '/img/default-photo.jpg', user: '' };
				this.name = data.name;
				this.photo = data.photo;
				this.user = data.user;
			}
		})

		.run(function (users, photos) {
			users.search({ name: 'elon musk' }).then(...);
			users.get({ id: 693147 }).then(...);

			photos.get({ id: 31415926 })
				.then(function (photo) {
					photo.name = 'Beach party';
					return photo.$save();
				})
				.then(...);

			var photo = photos.create({ name: 'Dungeon party', photo: photoUrl, user: 142857 });
			photo.save().then(...);
		})
		;

Note that the parametrization does not care which method you are using.  Hence,
if you want to use POST for both creating and for updating, simply ensure that
the 'id' given is null/undefined for creates and defined/non-null for updates.
Using an endpoint with path 'myApi/:id', this will send CREATEs (null id) to
'/myApi' and UPDATEs (non-null id) to '/myApi/:id'.  The Resource approach will
always use POST for create and PUT for update.

If an URL parameter is null, the slash preceeding that parameter is also removed,
to prevent double/trailing slashes from occuring in the URL.  It is not
recommended to null-out parameters that occur before the last parameter, as it
breaks the hierarchical design of endpoint (and presumably, your API too).
Note that properties of the optional 'params' object will take precedence over
properties of the optional 'body' object which have the same name, when
generating parametrizing URLs.

We could declare a constant which people append URL fragments to, but this
requires people to actually read a spec and to voluntarily follow a standard,
both of which seem like bad assumptions to make.

I also want services and sub-APIs to be modular and mountable in the front-end,
similar to the mounting/router design in the `express.js` back-end framework.
Reusable code => consistency + less maintanance.

Due to this, I decided to create a new class which wraps `$http`, rather than
extending `$resource`.

The `endpoint` exposes its parameters via properties.  Using
`https://api.mydomain.ee/collection/search?meaning=42` as an example, these
properties give:

 * protocol: `https`
 * path: `api.mydomain.ee/collection/search` ** Includes domain **
 * baseUrl: `https://api.mydomain.ee/collection/search` (protocol + path)
 * queryObj: `{ meaning: 42 }`
 * url:  `https://api.mydomain.ee/collection/search?meaning=42`

Hence although `endpoint` is designed to encapsulate URL generation, the targets
represented by the endpoint can be passed to `$http` and `$resource` if needed.

The path can be parametrized, for example:

	var userApi = new Endpoint('User API', { path: '/api/user/:userId' });

	var uid = 25;
	userApi.get({ params: { userId: uid } })
		.success(function (user) {
			user.country = 'Estonia';
			return userApi.put({ body: user });
		});

	

Endpoint works a bit like $resource but strictly requires human-readable names
for endpoints (to aid debugging), and has the extend/query mechanism for growing
a hierarchy of endpoints without repeating the base path or common parameters.

The automatic toasting on error was the main reason that I initially developed
this class.  Additionally, you can use the `isInvoking()` property to determine
whether there are any active requests on the endpoint or its descendants.

## Demo app (TODO list)

Dependencies: utils

### todo-app.js

	angular.module('todoApp', ['utils', 'ngMockE2E']);

### todo-backend.js

	angular.module('todoApp')
		.run(backend);

	function backend($httpBackend, $window, rootApi) {
		var lists;

		var q = '\\?apiKey=42$';

		var listsPath = rootApi.baseUrl + '/lists';

		var dumpRx = new RegExp('^' + listsPath + '/dump' + q);
		var listRx = new RegExp('^' + listsPath + '/([0-9]+)' + q);
		var listsRx = new RegExp('^' + listsPath + q);

		$httpBackend.whenGET(dumpRx)
			.respond(function () {
				console.log('Data dump from backend');
				console.info(JSON.stringify(lists));
				return [200];
			});
			
		$httpBackend.whenGET(listsRx).respond(getLists);
		$httpBackend.whenPOST(listsRx).respond(postList);

		$httpBackend.whenGET(listRx).respond(getList);
		$httpBackend.whenPUT(listRx).respond(putList);
		$httpBackend.whenDELETE(listRx).respond(deleteList);

		loadData();

		return;

		function loadData() {
			var data = $window.localStorage.getItem('todoLists');
			if (data) {
				lists = JSON.parse(data);
			} else {
				lists = [];
			}
		}

		function saveData() {
			$window.localStorage.setItem('todoLists', JSON.stringify(lists));
		}

		function dataChanged() {
			saveData();
		}

		function getId(url) {
			var id = listRx.exec(url)[1];
			if (String(Number(id)) !== id) {
				throw new Error('Invalid ID: ' + id);
			}
			return Number(id);
		}

		function getLists(method, url, data) {
			return [200, lists];
		}

		function postList(method, url, data) {
			var list = JSON.parse(data);
			if (list.id) {
				return [400];
			} else {
				var id = getNextId();
				list.id = id;
				lists.push(list);
				dataChanged();
				return [200, { id: id }];
			}
		}

		function getList(method, url) {
			var id = getId(url);
			var list = findListById(id);
			return list ? [200, list] : [404];
		}

		function putList(method, url, data) {
			var list = JSON.parse(data);
			var id = getId(url);
			if (id !== list.id) {
				return [400];
			}
			var index = indexOfId(id);
			if (index !== -1) {
				lists[index] = list;
				dataChanged();
				return [200];
			} else {
				return [404];
			}
		}

		function deleteList(method, url) {
			var id = getId(url);
			var index = indexOfId(id);
			if (index !== -1) {
				lists.splice(index, 1);
				dataChanged();
				return [200];
			} else {
				return [404];
			}
		}

		function findListById(id) {
			return _(lists).findWhere({ id: id });
		}

		function indexOfId(id) {
			var index = -1;
			lists.forEach(function (list, itemIndex) {
				if (list.id === id) {
					index = itemIndex;
				}
			});
			return index;
		}

		function getNextId() {
			return lists.reduce(function (id, list) {
				return Math.max(id, list.id + 1);
			}, 0);
		}
	}

### todo-api.js

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

### todo-service.js

	angular.module('todoApp')
		.factory('todoApi', todoApi)
		.factory('todoService', todoService);

	function todoApi(rootApi) {
		return rootApi.extend('Lists API', 'lists/:id');
	}

	function todoService($q, $rootScope, todoApi) {

		var model = {
			lists: [],
			selected: null,
		};

		refreshLists();

		return {
			model: model,
			refreshLists: refreshLists,
			selectList: selectList,
			newList: newList,
			saveList: saveList,
			deleteList: deleteList,
			newItem: newItem,
			dump: dump
		};

		function dump() {
			todoApi.get({ params: { id: 'dump' } });
		}

		function refreshLists() {
			return todoApi.get({ params: { id: null } })
				.then(function (result) {
					var lists = result.data;
					var selectedId = model.selected && model.selected.id;
					model.selected = null;
					model.lists = lists;
					selectList(
						_(model.lists).findWhere({ id: selectedId }) ||
						model.lists.length && model.lists[0] ||
						null);
				});
		}

		function selectList(list) {
			model.selected = list;
			$rootScope.$broadcast('selected list');
		}

		function newList() {
			var list = {
				id: null,
				name: 'New list',
				items: []
			};
			model.lists.push(list);
			selectList(list);
		}

		function saveList() {
			var list = model.selected;
			/*
			 * If the backend decides whether to create or update based on
			 * whether the id parameter is non-null, then we could just do
			 * `todoApi.post({ body: list })` if the default new list has a null id
			 * value.  I have used separate put/post here in order to demonstrate
			 * each method.
			 */
			if (list.id !== null) {
				return todoApi.put({ body: list });
			} else {
				return todoApi.post({ body: list })
					.then(function (result) {
						list.id = Number(result.data.id);
					});
			}
		}

		function deleteList() {
			var list = model.selected;
			if (list.id === null) {
				promise = $q.when();
			} else {
				promise = todoApi.del({ params: { id: list.id } });
			}
			return promise
				.then(function () {
					var index = model.lists.indexOf(list);
					model.lists.splice(index, 1);
					if (list === model.selected) {
						selectList(null);
					}
				});
		}

		function newItem() {
			var list = model.selected;
			list.items.push({ done: false, name: 'New item' });
		}

	}

### todo-controller.js

	angular.module('todoApp')
		.controller('todoController', todoController)
		.factory('busyTrackerInterceptor', busyTrackerInterceptor)
		.config(function ($httpProvider) {
			$httpProvider.interceptors.push('busyTrackerInterceptor')
		});

	/*
	 * Could also check isInvoking() on api endpoint, which would probably be
	 * better since requests from other parts of the application would then be
	 * ignored.
	 */
	function busyTrackerInterceptor($q, $rootScope) {
		var requestCount = 0;

		return {
			request: onRequest,
			response: onResponse,
			responseError: onResponseError
		};

		function requestStarted() {
			if (requestCount++ === 0) {
				$rootScope.$broadcast('busy', true);
			}
		}

		function requestEnded() {
			if (--requestCount === 0) {
				$rootScope.$broadcast('busy', false);
			}
		}

		function onRequest(config) {
			requestStarted();
			return config || $q.when(config);
		}

		function onResponse(response) {
			requestEnded();
			return response || $q.when(response);
		}

		function onResponseError(response) {
			requestEnded();
			return $q.reject(response);
		}
	}

	function todoController($scope, $rootScope, todoService) {
		var vm = $scope;

		vm.isBusy = false;

		vm.methods = {
			dump: todoService.dump
		};

		$rootScope.$on('busy', function (event, busy) { vm.isBusy = busy; });
	}

### lists-controller.js

	angular.module('todoApp')
		.controller('listsController', listsController);

	function listsController($scope, todoService) {
		var vm = $scope;

		vm.model = todoService.model;

		vm.methods = {
			newList: todoService.newList,
			openList: todoService.selectList,
			refreshLists: todoService.refreshLists
		};

		return;
	}

### list-controller.js

	angular.module('todoApp')
		.controller('listController', listController);
	
	function listController($scope, todoService) {
		var vm = $scope;

		vm.model = {};

		vm.methods = {
			saveList: todoService.saveList,
			deleteList: todoService.deleteList,
			newItem: todoService.newItem,
			editItem: editItem,
			saveItem: saveItem,
			deleteItem: deleteItem
		};

		vm.$on('selected list', onSelectedList);

		onSelectedList();
		
		return;

		function onSelectedList() {
			vm.model = {
				list: todoService.model.selected,
				editingItem: null
			};
		}

		function editItem(item) {
			vm.model.editingItem = item;
		}

		function saveItem(item) {
			vm.model.editingItem = null;
			return todoService.saveList();
		}

		function deleteItem(item) {
			var index = _(vm.model.list.indexOf).indexOf(item);
			if (index !== -1) {
				vm.model.list.splice(index, 1);
			}
			vm.model.editingItem = null;
		}
	}

### index.html

	<html lang="en">
		<head>
			<meta charset="utf-8">
			<title>Todo</title>
			<meta name="dependency" content="underscore">
			<meta name="dependency" content="toastr">
			<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
			<script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.min.js"></script>
			<meta name="dependency" content="angular-mocks">
			<script src="utils/dependency.js"></script>
			<script src="utils/module.js"></script>
			<script src="utils/endpoint.js"></script>
			<script src="utils/toaster.js"></script>
			<script src="todo-app.js"></script>
			<script src="todo-backend.js"></script>
			<script src="todo-api.js"></script>
			<script src="todo-service.js"></script>
			<script src="todo-controller.js"></script>
			<script src="lists-controller.js"></script>
			<script src="list-controller.js"></script>
			<link rel="stylesheet" href="style.css">
			<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">
		</head>
		<!-- TODO lists application -->
		<body>
			<fieldset class="todo-app"
				ng-app="todoApp"
				ng-controller="todoController"
				ng-class="{ disabled: isWorking() }"
				ng-disabled="isBusy">
				<!-- List of TODO lists -->
				<form class="todo-lists" name="todoLists"
					ng-controller="listsController">
					<fieldset
						ng-disabled="!model.lists">
						<h1>All TODO lists</h1>
						<div class="toolbar">
							<input type="button" class="todo-list-new" value="New list"
								ng-click="methods.newList()">
							<input type="button" class="todo-list-refresh" value="Refresh"
								ng-click="methods.refreshLists()">
						</div>
						<div class="list-box">
							<div class="list-item"
								ng-repeat="list in model.lists"
								ng-class="{ selected: list === model.selected, transient: list.id === null }"
								ng-click="methods.openList(list)">
								<span class="todo-list-name">{{ list.name }}</span>
							</div>
						</div>
					</fieldset>
				</form>
				<!-- Selected TODO list -->
				<form class="todo-list" name="todoList"
					ng-controller="listController">
					<fieldset
						ng-disabled="!model.list">
						<h1>View/edit TODO list</h1>
						<div class="toolbar">
							<input type="button" class="todo-list-item-new" value="New item"
								ng-disabled="todoList.$invalid"
								ng-click="methods.newItem()">
							<input type="button" class="todo-list-save" value="Save list"
								ng-disabled="todoList.$invalid"
								ng-click="methods.saveList()">
							<span class="spacer"></span>
							<input type="button" class="todo-list-item-delete" value="Delete list"
								ng-click="methods.deleteList()">
						</div>
						<div class="toolbar">
							<label for="list-name" class="name-label">Name</label>
							<input type="text" id="list-name" required
								ng-disabled="!model.list"
								ng-model="model.list.name">
						</div>
						<!-- List of TODO items -->
						<div class="list-box">
							<div class="list-item"
								ng-repeat="item in model.list.items"
								ng-init="index = $index"
								ng-class="{ done: item.done, selected: item === model.editingItem }">
								<!-- Not editing view -->
								<span
									ng-hide="item === model.editingItem">
									<input type="checkbox" class="todo-list-item-is-done"
										id="{{ 'todo-item-done-' + index }}"
										ng-model="item.done"
										ng-blur="methods.saveItem(item)"
										ng-change="methods.saveItem(item)">
									<label class="todo-list-item-name"
										for="{{ 'todo-item-done-' + index }}">
										<span class="todo-list-item-name-text">{{ item.name }}</span>
									</label>
									<span class="buttons">
										<input type="button" class="todo-list-item-edit" value="Edit"
											ng-click="methods.editItem(item)">
										<input type="button" class="todo-list-item-delete" value="Delete"
											ng-hide="model.editingItem !== null"
											ng-click="methods.deleteItem(item)">
									</span>
								</span>
								<!-- Editing view -->
								<span
									ng-show="item === model.editingItem">
									<input type="text" class="todo-list-item-name" required
										ng-model="item.name">
									<span class="buttons">
										<input type="button" class="todo-list-item-save" value="Save"
											ng-click="methods.saveItem(item)">
									</span>
								</span>
							</div>
						</div>
					</fieldset>
				</form>
				<div>
					<div class="buttons bottom">
						<input type="button" class="todo-dump" value="Dump to console"
							ng-click="methods.dump()">
					</div>
				</div>
			</fieldset>
		</body>
	</html>

### style.css

	* {
		box-sizing: border-box;
	}

	html,
	body {
		font-family: sans-serif;
		font-size: 16px;
		background: gray;
	}

	.todo-app,
	.todo-app>* {
		margin: 10px;
		border: 1px solid black;
		border-radius: 10px;
		padding: 0;
		overflow: hidden;
	}

	.todo-app {
		display: block;
		background: dodgerblue;
	}

	.todo-app>* {
		background: lightcyan;
	}

	.todo-app h1 {
		text-align: center;
		font-size: 24px;
	}

	.todo-app .toolbar {
		border-top: 1px solid black;
		border-bottom: 1px solid black;
		border-left: 0;
		border-right: 0;
		border-radius: 0;
		display: flex;
		flex-flow: row wrap;
		align-items: stretch;
		padding: 5px 10px 5px 10px;
	}

	.todo-app fieldset {
		padding: 0;
		margin: 0;
		border: 0;
	}

	.todo-app .toolbar+.toolbar {
		border-top: none;
	}

	.todo-app .toolbar>* {
		margin: 2px;
	}

	.todo-app .toolbar>label {
		margin-left: 10px;
		margin-right: 5px;
	}

	.todo-app .toolbar>label:after {
		content: ':'
	}

	.todo-app .toolbar>.spacer {
		width: 5px;
	}

	.todo-app .buttons {
		border: 0px;
		border-radius: 0;
		float: right;
		clear: right;
		margin-top: 0;
		margin-bottom: 0;
		padding: 0;
	}

	.todo-app .bottom {
		float: none;
		clear: none;
		padding: 10px;
	}

	.todo-app input[type=button] {
		border-radius: 5px;
	}

	.todo-app .todo-lists {
		flex: 1 1 400px;
	}

	.todo-app .todo-list {
		flex: 1 0 600px;
	}

	.todo-app .list-box {
		overflow-x: auto;
		overflow-y: auto;
		background: white;
		height: 270px;
	}

	.todo-app .list-box .list-item {
		padding: 10px;
		background: skyblue;
	}

	.todo-app .list-box .list-item.selected {
		background: steelblue;
		color: white;
		border: none;
	}

	.todo-app .list-box .list-item.done {
	}

	.todo-app .list-box .list-item.transient {
		font-style: italic;
	}

	.todo-app .list-box .list-item.transient:after {
		content: '*';
	}

	.todo-app .todo-list-item-is-done {
		display: none;
	}

	.todo-app .todo-list-item-name-text {
		padding-right: 200px;
	}

	.todo-app .todo-list-item-name-text:before {
		font-family: 'FontAwesome';
		content: '\f096';
		margin: 10px;
		margin-left: 0;
	}

	.todo-app .done .todo-list-item-name-text:before {
		content: '\f046';
	}
