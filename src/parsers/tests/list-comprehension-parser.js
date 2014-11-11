tests.push({
	name: 'list-comprehension-parser',
	group: 'Parsers',
	modules: ['battlesnake.parsers'],
	after: ['comprehension-parser'],
	test: function (listComprehensionService) {

	describe('List comprehension parser', function () {

		describe('Performance', function () {

			var compile_repeat = 10;
			var target = 5;
			it('Compiles the parser in under ' + target + 'ms ' +
				'(averaging over ' + compile_repeat + ' runs)', function () {

				var start = new Date().getTime();

				for (var i = 0; i < compile_repeat; i++) {
					listComprehensionService.test.compile();
				}

				var end = new Date().getTime();

				var duration = (end - start) / compile_repeat;

				expect(duration).to.be.below(target);

				console.info('Average compile time for list comprehension ' +
					'parser: ' + duration.toFixed(2) + 'ms');

			});

		});

		describe('Parses a bare expression', function () {

			it('func(array[index].value)', function () {
				var expr = 'func(array[index].value)';
				var comp = listComprehensionService.test.parse(expr);
				expect(comp.source).to.equal(expr);
			});

		});

		describe('Parses AngularJS ngOptions example formats', function () {

			test('label for value in array');
			test('select as label for value in array');
			test('label group by group for value in array');
			test('select as label group by group for value in array');
			test('select as label group by group for value in array track by trackexpr');

			test('label for (key, value) in object');
			test('select as label for (key, value) in object');
			test('label group by group for (key, value) in object');
			test('select as label group by group for (key, value) in object');
			test('select as label group by group for (key, value) in object track by trackexpr');

			function test(format) {
				it(format, function () {
					var comp;
					expect(
						function () {
							comp = listComprehensionService.test.parse(format);
						})
						.to.not.throw();
					verify({
						select: 'select',
						label: 'label',
						group: 'group',
						key: 'key',
						value: 'value',
						source: format.indexOf('array') === -1 ? 'object' : 'array',
						memo: 'trackexpr'
					});
					/*
					 * If the key is contained in the format, ensure the capture
					 * matches the test value (defaults to key)
					 */
					function verify(map) {
						_(map).each(function (value, key) {
							if (format.indexOf(key) !== -1) {
								expect(comp[key]).to.equal(value || key);
							}
						});
					}
				});
			}

		});

		describe('Fills defaults correctly', function () {

			test('item.label for item in items',
				'item.label as item.label for item in items track by item.label');
			test('item.value as item.label for item in items',
				'item.value as item.label for item in items track by item.value');
			test('item.label group by item.group for item in items',
				'item.label as item.label group by item.group for item in items track by item.label');
			test('item.value as item.label group by item.group for item in items',
				'item.value as item.label group by item.group for item in items track by item.value');
			
			test('item.value as item.label group by item.group for item in items track by item.id',
				'item.value as item.label group by item.group for item in items track by item.id');
			test('key for (key, value) in object',
				'key as key for (key, value) in object track by key');
			test('value as key for (key, value) in object track by value',
				'value as key for (key, value) in object track by value');
			test('key group by value.group for (key, value) in object',
				'key as key group by value.group for (key, value) in object track by key');
			test('value as key group by value.group for (key, value) in object',
				'value as key group by value.group for (key, value) in object track by value');
			test('value as key group by value.group for (key, value) in object track by value.id',
				'value as key group by value.group for (key, value) in object track by value.id');

			function test(format, result) {
				/*
				 * Eval hack to make the code displayed on the test page look
				 * nice and readable, since tests should also serve as
				 * documentation / demonstration.
				 */
				var fn = new Function('listComprehensionService',
					'return function () { expect(\n  listComprehensionService.' +
					'test.fillDefaults(\n    \'' + format.replace(/'/g, '\\\'') +
					'\'))\n  .to.equal(\n    \'' + result.replace(/'/g, '\\\'') +
					'\');\n};');
				it(format, fn(listComprehensionService));
			}


		});

		/*it('Log the regular expression to the console for your entertainment', function () {
			var parser = listComprehensionService.test.compile().parser;

			console.info('Comprehension parser');
			console.info('Regex (' + parser.regex.toString().length + ' chars)', parser.regex);
			console.info('Capture group to named capture mapping table', _(parser.matchMaps)
				.reduce(function (ar, values, key) {
					values.forEach(function (value) {
						ar[value] = key;
					});
					return ar;
				}, ['(n/a)']));

		});*/

	});

}});
