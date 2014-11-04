
angular.module('demoApp', ['fields']);

angular.module('demoApp')
	.controller('demoController', demoController);

function demoController($scope) {

	$scope.model = {
		gender: 'M',
		country: 44,
		genders: [],
		countries: [372, 358, 380, 354, 370]
	};

	$scope.data = {
		genders: [
			{ title: 'Male', value: 'M' },
			{ title: 'Female', value: 'F' }
		],
		countries: [
			{ title: 'Estonia', value: 372 },
			{ title: 'UK', value: 44 },
			{ title: 'USA', value: 1 },
			{ title: 'Finland', value: 358 },
			{ title: 'Lithuania', value: 370 },
			{ title: 'France', value: 33 },
			{ title: 'Latvia', value: 371 },
			{ title: 'Iceland', value: 354 },
			{ title: 'Ukraine', value: 380 },
			{ title: 'Belgium', value: 32 }
		]
	};

}

