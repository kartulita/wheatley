
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

