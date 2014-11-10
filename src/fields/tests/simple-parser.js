tests.push({
	name: 'simple-parser',
	group: 'parsers',
	modules: ['fields'],
	test: function (simpleParseService) {

	describe('Simple parser', function () {
		/* Define a language */
		var outer = { name: 'outer', start: '{', end: '}', subgroups: [] };
		var inner = { name: 'inner', start: '[', end: ']', subgroups: [] };
		var any = { name: 'any', start: '(', end: ')', subgroups: [] };
		var entity = { name: 'entity', start: '-', end: '-', subgroups: [] };
		outer.subgroups = [inner, any, entity];
		inner.subgroups = [any, entity];
		any.subgroups = [entity];
		var language = [outer, any, entity];

		it('Parses text block', function () {
			var expr = 'text block';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('text');
			expect(tree[0].value).to.equal('text block');
		});

		it('Parses entity', function () {
			var expr = '-';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('entity');
		});

		it('Parses empty block', function () {
			var expr = '()';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('any');
			expect(tree[0].value.length).to.equal(0);
		});

		it('Parses block containing text', function () {
			var expr = '(x)';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('any');
			expect(tree[0].value.length).to.equal(1);
			expect(tree[0].value[0].type).to.equal('text');
			expect(tree[0].value[0].value).to.equal('x');
		});

		it('Parses block containing entity', function () {
			var expr = '(-)';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('any');
			expect(tree[0].value.length).to.equal(1);
			expect(tree[0].value[0].type).to.equal('entity');
		});

		it('Parses nested blocks', function () {
			var expr = '{[]}';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
			expect(tree.length).to.equal(1);
			expect(tree[0].type).to.equal('outer');
			expect(tree[0].value.length).to.equal(1);
			expect(tree[0].value[0].type).to.equal('inner');
			expect(tree[0].value[0].value.length).to.equal(0);
		});

		it('Fails on unterminated blocks', function () {
			expect(function () {
				var tree = simpleParseService('{', language);
			}).to.throw(Error);
			expect(function () {
				var tree = simpleParseService(')(', language);
			}).to.throw(Error);
		});

		it('Fails on invalid nesting', function () {
			expect(function () {
				var tree = simpleParseService('{[}]', language);
			}).to.throw(Error);
		});

		it('Obeys nesting rules', function () {
			(function () {
				var expr = '({[]})';
				var tree = simpleParseService('({[]})', language);
				expect(simpleParseService.unparse(tree, language)).to.equal(expr);
				expect(tree.length).to.equal(1);
				expect(tree[0].type).to.equal('any');
				expect(tree[0].value.length).to.equal(1);
				expect(tree[0].value[0].type).to.equal('text');
				expect(tree[0].value[0].value).to.equal('{[]}');
			})();
			(function () {
				var expr = '{[-{(x)}]}';
				var tree = simpleParseService(expr, language);
				expect(simpleParseService.unparse(tree, language)).to.equal(expr);
				expect(tree.length).to.equal(1);
				expect(tree[0].type).to.equal('outer');
				expect(tree[0].value.length).to.equal(1);
				expect(tree[0].value[0].type).to.equal('inner');
				expect(tree[0].value[0].value.length).to.equal(4);
				expect(tree[0].value[0].value[0].type).to.equal('entity');
				expect(tree[0].value[0].value[1].type).to.equal('text');
				expect(tree[0].value[0].value[1].value).to.equal('{');
				expect(tree[0].value[0].value[2].type).to.equal('any');
				expect(tree[0].value[0].value[2].value.length).to.equal(1);
				expect(tree[0].value[0].value[2].value[0].type).to.equal('text');
				expect(tree[0].value[0].value[2].value[0].value).to.equal('x');
				expect(tree[0].value[0].value[3].type).to.equal('text');
				expect(tree[0].value[0].value[3].value).to.equal('}');
			})();
		});

		it('Parses complex expression', function () {
			var expr = '(1-2-{3}-[4])-5-[6]-{7-[8-{9}]-(A)}';
			var tree = simpleParseService(expr, language);
			expect(simpleParseService.unparse(tree, language)).to.equal(expr);
		});

	});

}});
