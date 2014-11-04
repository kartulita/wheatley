
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

