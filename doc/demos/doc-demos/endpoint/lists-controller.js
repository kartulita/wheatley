
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

