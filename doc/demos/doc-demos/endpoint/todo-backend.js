
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

