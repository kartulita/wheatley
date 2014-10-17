
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

