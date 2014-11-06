describe('Autocomplete', function () {

	var injector = angular.injector(['fields']);

	var $compile = injector.get('$compile');
	var $rootScope = injector.get('$rootScope');

	var scope;

	beforeEach(module('fields'));

	beforeEach(function () {
		scope = generateScope();
	});

	describe('HTML elements', function () {

		var el;

		beforeEach(function () {
			el = generateDirective(scope, 'model.people[0].country', 'data.countries');
		});

		it('Generated a text-box', function () {
			expect(el.find('input').length).toEqual(1);
		});

		it('Generated a choice-list', function () {
			expect(el.find('ul').length).toEqual(1);
		});

	});

	describe('Value lookup', function () {

		var el;

		beforeEach(function () {
			el = generateDirective(scope, 'model.people[0].country', 'data.countries');
		});

		it('Updates model with correct values in response to user input', function () {

		});

	});

	function generateDirective(scope, value, data) {
		var html = '<div><field:autocomplete ng-model="' + value + '" x-choices="' + data + '"/></div>';
		var el = $compile(html)(scope);
		scope.$digest();
	}

	function generateScope() {
		var scope = $rootScope.new();
		scope.model = {
			people: [
				{
					name: 'Mark',
					gender: 'M',
					country: 44
				},
				{
					name: 'Mari',
					gender: 'F',
					country: 372
				},
				{
					name: 'Rob',
					gender: 'D',
					country: 370
				},
				{
					name: 'Jaari',
					gender: 'M',
					country: 358
				},
				{
					name: 'Celia',
					gender: 'F',
					country: 33
				},
				{
					name: 'Darth',
					gender: 'M',
					country: 380
				}
			]
		};
		scope.data = {
			genders: [
				{ title: 'Male', value: 'M' },
				{ title: 'Female', value: 'F' },
				/* South Park reference */
				{ title: 'Dolphin', value: 'D' }
			],
			countries: [
				{ title: 'Estonia', value: 372 },
				{ title: 'UK', value: 44 },
				{ title: 'Finland', value: 358 },
				{ title: 'Lithuania', value: 370 },
				{ title: 'France', value: 33 },
				{ title: 'Latvia', value: 371 },
				{ title: 'Iceland', value: 354 },
				{ title: 'Ukraine', value: 380 },
				{ title: 'Belgium', value: 32 },
				{ title: 'USA', value: 1 }
			]
		};
		return scope;
	}

});
