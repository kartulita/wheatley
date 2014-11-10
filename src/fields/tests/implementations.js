tests.push({
	name: 'autocomplete',
	group: 'implementations',
	modules: ['fields'],
	test: function ($rootScope, $compile) {

	describe('Autocomplete', function () {

		var scope, el;

		beforeEach(module('fields'));

		beforeEach(function () {
			scope = generateScope();
		});


		describe('HTML elements', function () {

			beforeEach(function () {
				el = generateDirective(scope, 'model.country', 'data.countries');
			});

			it('Generated a text-box', function () {
				expect(el.find('input').length).to.equal(1);
			});

			it('Generated a suggestion list', function () {
				expect(el.find('ul').length).to.equal(1);
			});

		});

		/*
		 * Need some way to simulate input, which will trigger the autocomplete's
		 * event listeners
		describe('Data binding', function () {

			function sendkeys(e, str) {
				var j = $(e);
				console.log(e, j);
				j.trigger({ type: 'focus' });
				j.scope().$digest();
				str.split('').forEach(function (key) {
					var code = key.charCodeAt(0);
					j.val(j.val() +'' + key);
					j.trigger({ type: 'keydown', which: code, keyCode: code });
					j.scope().$digest();
					j.trigger({ type: 'keypress', which: code, keyCode: code });
					j.scope().$digest();
					j.trigger({ type: 'keyup', which: code, keyCode: code });
					j.scope().$digest();
					j.trigger({ type: 'change' });
					j.scope().$digest();
				});
			}

			it('Updates model with correct values in response to user input', function () {
				var box = el.find('input')[0];
				box.value = '';
				sendkeys(box, 'Estoni\n');
				expect(scope.model.country).to.equal(372);
				box.value = '';
				sendkeys(box, 'Lith\n');
				expect(scope.model.country).to.equal(370);
			});

		});
		*/

		function generateDirective(scope, value, data) {
			var html = '<div><field:autocomplete ng-model="' + value + '" x-choices="' + data + '"></field:autocomplete></div>';
			var el = $compile(html)(scope);
			scope.$digest();
			return el;
		}

		function generateScope() {
			var scope = $rootScope.$new();
			scope.model = {
				country: 44
			};
			scope.data = {
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

}});
