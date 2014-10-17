# Utils

Miscallaneous utilities

## Endpoint

Wraps the `endpoint` object in an angular factory.  This makes it easier to track
where API target are called from, since each API target should be represented
by one and only one endpoint object.  It also makes it easier to "mount"
sub-services within others, by extending endpoints.  Switching the entier app
from a "test" API server to the "production" API server becomes much easier,
since only the API root endpoint needs to be changed.

The `endpoint` exposes its parameters via properties.  Using
`https://api.mydomain.ee/some/resource?id=42` as an example, these properties
give:

 * protocol: `https`
 * path: `api.mydomain.ee/some/resource` ** Includes domain **
 * baseUrl: `https://api.mydomain.ee/some/resource`
 * queryObj: `{ id: 42 }`
 * url:  `https://api.mydomain.ee/some/resource?id=42`

Hence although `endpoint` is designed to encapsulate URL generation, the targets
represented by the endpoint can be passed to `$http` and `$resource` if needed.

The path can be parametrized, for example:

	var user = new Endpoint('User API', false, '/api/user/:userId');

	var uid = 25;
	users.get({ userId: uid })
		.success(function (user) {
			user.country = 'Estonia';
			users.put({ userId: uid }, user);
		});

Endpoint works a bit like $resource but strictly requires human-readable names
for endpoints (to aid debugging), and has the extend/query mechanism for growing
a hierarchy of endpoints (DRY).

It currently uses $http internally, but should probably use $resource instead so
that it doesn't have to duplicate the parametrization logic of $resource.

The automatic toasting on error was the main reason that I developed this class.
Also, you can use the `isInvoking()` property to determine whether there are any
active requests on the endpoint or its descendants.

This class would probably be better served as an extension or monkeypatch for
$resource, but for now lets see how it goes.

### todo-app.js

	angular.module('todoApp', ['utils', 'ngMockE2E']);

### todo-backend.js

	angular.module('todoApp')
		.run(backend);

	function backend($httpBackend, todoService) {
		var lists = [];

		var q = '\\?apiKey=42$'

		var dumpRx = new RegExp('^' + todoService.endpoint.path + '/dump' + q);
		var listRx = new RegExp('^' + todoService.endpoint.path + '/([0-9]+)' + q);
		var listsRx = new RegExp('^' + todoService.endpoint.path + q);

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

### todo-service.js

	angular.module('todoApp')
		.factory('todoService', todoService);

	function todoService($q, $rootScope, apiEndpoint) {
		var listsApi = apiEndpoint.extend('Lists API', 'lists');
		var listApi = listsApi.extend('List API', ':id');

		var model = {
			lists: [],
			selected: null,
		};

		refreshLists();

		return {
			endpoint: listsApi,
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
			listsApi.extend('Debug data dump', 'dump').get();
		}

		function refreshLists() {
			return listsApi.get()
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
			if (list.id !== null) {
				return listApi.put({ id: list.id }, list);
			} else {
				return listsApi.post(null, list)
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
				promise = listApi.del({ id: list.id });
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
