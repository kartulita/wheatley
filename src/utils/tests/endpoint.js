tests.push({
	name: 'endpoint',
	group: 'api',
	modules: ['battlesnake.utils', 'ngMock'],
	test: function ($httpBackend, Endpoint) {

	describe('Endpoint', function () {

		describe('URL generator', function () {

			it('Parse URL with protocol and path correctly', function () {
				var path = 'http://mydomain:1234/path/to/resource';
				var endpoint = new Endpoint('Simple', path);
				expect(endpoint.url).to.equal(path);
				expect(endpoint.protocol).to.equal('http');
				expect(endpoint.path).to.equal('mydomain:1234/path/to/resource');
				expect(endpoint.queryString).to.equal('');
				expect(endpoint.secure).to.equal(false);
				expect(endpoint.domainless).to.equal(false);
			});

			it('Return blank string for "same protocol" URL', function () {
				expect(new Endpoint('test', '//domain/path').protocol).to.equal('');
			});

			it('Return null for protocol of relative URL', function () {
				expect(new Endpoint('test', '/path').protocol).to.equal(null);
			});

			it('Return string without colon or slashes for protocol', function () {
				expect(new Endpoint('test', 'test://domain/path').protocol).to.equal('test');
			});

			it('Generate URL with properly escaped query part', function () {
				var endpoint = new Endpoint('Simple',
					{
						path: '/',
						query: {
							'null': null,
							'false': false,
							'true': true,
							number: 31.25,
							string: 'escape this & that?',
							array: [1, 2, 3],
							date: new Date(0)
						}
					});

				expect(endpoint.protocol).to.equal(null);
				expect(endpoint.secure).to.equal(false);
				expect(endpoint.domainless).to.equal(true);
				expect(endpoint.absolute).to.equal(true);
				expect(endpoint.path).to.equal('/');

				/* Break returned query string into object */
				var q = _(endpoint.queryString
					.split('&')
					.map(function (s) {
						var eq = s.indexOf('=');
						if (eq === -1) {
							return [s, ''];
						} else if (eq === s.length - 1) {
							return [s.substr(0, s.length - 1), ''];
						}
						var k = s.substr(0, eq);
						var v = s.substr(eq + 1);
						return [k, v];
					}))
					.object();

				expect(q.null).to.equal('');
				expect(q.false).to.equal('false');
				expect(q.true).to.equal('true');
				expect(q.number).to.equal('31.25');
				expect(q.string).to.equal('escape+this+%26+that%3F');
				expect(q.array).to.equal('1%2C2%2C3');
				expect(q.date).to.equal('1970-01-01T00:00:00.000Z');
			});

			it('Forbid relative URLs when a protocol is specified', function () {
				expect(function () { new Endpoint('test', { path: '/api/test', protocol: 'http' }); }).Throw();
				expect(function () { new Endpoint('test', { path: '/api/test', secure: false }); }).Throw();
				expect(function () { new Endpoint('test', { path: '//api/test' }); }).not.Throw();
				expect(function () { new Endpoint('test', { path: '//api/test', protocol: 'http' }); }).Throw();
			});

			it('Allow relative URL when no protocol is specified and return blank for protocol', function () {
				expect(new Endpoint('test', { path: '//api/test' }).protocol).to.equal('');
			});

			it('Forbid conflicting protocol specifications', function () {
				expect(function () { new Endpoint('test', { path: 'http://domain', protocol: 'https' }); }).Throw();
				expect(function () { new Endpoint('test', { path: 'https://domain', secure: false }); }).Throw();
				expect(function () { new Endpoint('test', { path: 'domain', protocol: 'https', secure: false }); }).Throw();
				expect(function () { new Endpoint('test', { path: 'https://domain', secure: true, protocol: 'https' }); }).not.Throw();
			});

			it('Fill route parameters', function () {
				var endpoint = new Endpoint('test', '/:param');
				expect(endpoint.parametrize({ param: 'value' })).to.equal('/value');
			});

			it('Escape route parameters as needed', function () {
				var endpoint = new Endpoint('test', '/:param');
				expect(endpoint.parametrize({ param: 'space bar' })).to.equal('/space%20bar');
				expect(endpoint.parametrize({ param: '@at' })).to.equal('/@at');
				expect(endpoint.parametrize({ param: ':colon' })).to.equal('/:colon');
				expect(endpoint.parametrize({ param: '$dollar' })).to.equal('/$dollar');
				expect(endpoint.parametrize({ param: '&ampersand' })).to.equal('/&ampersand');
				expect(endpoint.parametrize({ param: '2&2=1+1-0' })).to.equal('/2&2=1+1-0');
				expect(endpoint.parametrize({ param: 'hash#' })).to.equal('/hash%23');
				expect(endpoint.parametrize({ param: 'percent%' })).to.equal('/percent%25');
				expect(endpoint.parametrize({ param: 'comma,' })).to.equal('/comma%2C');
				expect(endpoint.parametrize({ param: 'slash/' })).to.equal('/slash%2F');
				expect(endpoint.parametrize({ param: 'question?' })).to.equal('/question%3F');
			});

			it('Collapse empty route parameters', function () {
				var endpoint = new Endpoint('test', '/api/:collection/:id');
				expect(endpoint.parametrize({ collection: 'myCollection', id: 666 })).to.equal('/api/myCollection/666');
				expect(endpoint.parametrize({ collection: 'myCollection' })).to.equal('/api/myCollection');
				/* Not sure why you'd do this next one, but let's test it anyway */
				expect(endpoint.parametrize({ id: -42 })).to.equal('/api/-42');
				expect(endpoint.parametrize({})).to.equal('/api');
				expect(endpoint.parametrize()).to.equal('/api/:collection/:id');
			});

		});

		describe('Request generator', function () {

			afterEach(inject(function ($httpBackend) {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			}));

			function response() {
				return null;
			}
			
			it('Send request', function () {
				var endpoint = new Endpoint('test', 'http://test/address');
				$httpBackend.expectGET('http://test/address').respond({});
				endpoint.get();
				$httpBackend.flush();
			});
			
			it('Send parametrized request', function () {
				var endpoint = new Endpoint('test', 'http://test/address/:id');
				$httpBackend.expectGET('http://test/address/42').respond({});
				endpoint.get({ params: { id: 42 } });
				$httpBackend.flush();
			});
			
			it('Send request with query', function () {
				var endpoint = new Endpoint('test', 'http://test/address');
				$httpBackend.expectGET('http://test/address?id=42').respond({});
				endpoint.get({ query: { id: 42 } });
				$httpBackend.flush();
			});
			
			it('Send request with body', function () {
				var endpoint = new Endpoint('test', 'http://test/address');
				var body = { array: [1, 2, null], string: 'str', number: 3.14, date: new Date(0) };
				$httpBackend.expectPOST('http://test/address', JSON.stringify(body)).respond({});
				endpoint.post({ body: body });
				$httpBackend.flush();
			});
			
			it('Send parametrized request with query and body', function () {
				var endpoint = new Endpoint('test', 'http://test/address/:id');
				var body = { array: [1, 2, null], string: 'str', number: 3.14, date: new Date(0) };
				$httpBackend.expectPUT('http://test/address/13?q=test', JSON.stringify(body)).respond({});
				endpoint.put({ body: body, query: { q: 'test' }, params: { id: 13 } });
				$httpBackend.flush();
			});
			
			it('Parametrized the path using data from query, then body, and not the query', function () {
				var endpoint = new Endpoint('test', 'http://test/address/:a/:ab/:b');
				var params = { a: 'a', ab: 'ab' };
				var body = { ab: 'ba', b: 'b' };
				var query = { a: 'p', ab: 'q', b: 'r', c: 'c' };
				$httpBackend.expectPUT('http://test/address/a/ab/b?a=p&ab=q&b=r&c=c', JSON.stringify(body)).respond({});
				endpoint.put({ params: params, body: body, query: query });
				$httpBackend.flush();
			});
		});

		describe('Resource access', function () {

			afterEach(inject(function ($httpBackend) {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			}));

			function User(data) {
				data = data || {};
				this.id = data.id;
				this.name = data.name || 'User name';
			}

			var endpoint = new Endpoint('test', 'test://api/:collection/:id');
			var userApi = endpoint.param('users', 'collection', 'user');
			var photoApi = endpoint.param('photos', 'collection', 'photo');
			var users = userApi.defineResource(User);
			var user;

			it('Mark new object as new', function () {
				user = users.create();
				user.name = 'Marky Mark';
				expect(user.$isNew).to.equal(true);
			});

			it('Create with POST', function () {
				$httpBackend.expectPOST('test://api/user', JSON.stringify({ name: 'Marky Mark' })).respond({ id: 666 });
				user.$save();
				$httpBackend.flush();
			});

			it('Unmark saved object as new', function () {
				expect(user.$isNew).to.equal(false);
			});

			it('Have received ID for new item', function () {
				expect(user.id).to.equal(666);
			});

			it('Read with GET', function () {
				user = null;
				$httpBackend.expectGET('test://api/user/666').respond({ id: 666, name: 'Marky Mark' });
				users.load({ id: 666 })
					.then(function (data) { user = data; });
				$httpBackend.flush();
			});

			it('Not be marked as new or as deleted', function () {
				expect(user.$isNew).to.equal(false);
				expect(user.$deleted).to.equal(false);
			});

			it('Update with PUT', function () {
				$httpBackend.expectPUT('test://api/user/666', JSON.stringify({ id: 666, name: 'Mari ploom' })).respond({ name: 'Mari Ploom' });
				user.name = 'Mari ploom';
				user.$save();
				$httpBackend.flush();
			});

			it('Response data from saves is merged back into objects', function () {
				expect(user.name).to.equal('Mari Ploom');
			});

			it('Delete with DELETE', function () {
				$httpBackend.expectDELETE('test://api/user/666').respond({});
				user.$remove();
				$httpBackend.flush();
			});

			it('Freeze deleted object and mark as deleted', function () {
				expect(Object.isFrozen(user)).to.equal(true);
				expect(user.$deleted).to.equal(true);
			});
			
		});

	});

}});
