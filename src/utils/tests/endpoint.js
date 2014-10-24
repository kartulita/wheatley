describe('Testing Endpoint URL generator', function () {
	
	var Endpoint = angular.injector(['utils']).get('Endpoint');

	it('should parse URL with protocol and path correctly', function () {
		var path = 'http://mydomain:1234/path/to/resource';
		var endpoint = new Endpoint('Simple', path);
		expect(endpoint.url).toEqual(simple);
		expect(endpoint.protocol).toEqual('http');
		expect(endpoint.path).toEqual('mydomain:1234/path/to/resource');
		expect(endpoint.queryString).toEqual('');
		expect(endpoint.secure).toBe(false);
		expect(endpoint.domainless).toBe(false);
	});

	it('should generate URL with query string correctly', function () {
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
		expect(endpoint.protocol).toEqual(null);
		expect(endpoint.secure).toBe(false);
		expect(endpoint.domainless).toBe(true);
		expect(endpoint.absolute).toBe(true);
		expect(endpoint.path).toEqual('/');
		expect(endpoint.queryString).toEqual(
			[
				'null=null',
				'false=false',
				'true=true',
				'number=31.25',
				'string=escape+this+%26+that+%3F',
				'array=1,2,3',
				'date=1970-01-01T00:00:00.000Z'
			].join('&'));
	});

	it('should forbid relative URLs when a protocol is specified', function () {
		function exec(params) {
			return new Endpoint(params);
		}
		
		expect(function () { exec({ path: '/api/test', protocol: 'http' }); }).toThrow();
		expect(function () { exec({ path: '/api/test', secure: false }); }).toThrow();
		expect(function () { return exec({ path: '//api/test' }).protocol; }).toEqual('');
		expect(function () { exec({ path: '//api/test' }); }).not.toThrow();
		expect(function () { exec({ path: '//api/test', protocol: 'http' }); }).toThrow();
	});

	it('should forbid conflicting protocol specifications', function () {
		function exec(params) {
			return new Endpoint(params);
		}
		
		expect(function () { exec({ path: 'http://domain', protocol: 'https' }); }).toThrow();
		expect(function () { exec({ path: 'https://domain', secure: false }); }).toThrow();
		expect(function () { exec({ path: 'domain', protocol: 'https', secure: false }); }).toThrow();
		expect(function () { exec({ path: 'https://domain', secure: true, protocol: 'https' }); }).not.toThrow();
	});

	it('should fill and escape route parameters', function () {
		var endpoint = new Endpoint('/:param');
		expect(endpoint.parametrize({ param: 'value' })).toEqual('/value');
		expect(endpoint.parametrize({ param: 'space bar' })).toEqual('/space%20bar');
		expect(endpoint.parametrize({ param: 'comma,' })).toEqual('/comma,');
		expect(endpoint.parametrize({ param: '@t-sign,:colon,$dollar' })).toEqual('/@t-sign,:colon,$dollar');
		expect(endpoint.parametrize({ param: '2&2=1+1-0' })).toEqual('/2&2=1+1-0');
		expect(endpoint.parametrize({ param: 'hash#' }).toUpperCase()).toEqual('/hash%23');
		expect(endpoint.parametrize({ param: 'percent%' }).toUpperCase()).toEqual('/percent%25');
		expect(endpoint.parametrize({ param: 'ampersand&' }).toUpperCase()).toEqual('/ampersand%26');
		expect(endpoint.parametrize({ param: 'slash/' }).toUpperCase()).toEqual('/slash%2F');
		expect(endpoint.parametrize({ param: 'question?' }).toUpperCase()).toEqual('/question%3F');
	});

	it('should collapse empty route parameters', function () {
		var endpoint = new Endpoint('/api/:collection/:id');
		expect(endpoint.parametrize({ collection: 'myCollection', id: 666 })).toEqual('/api/myCollection/666');
		expect(endpoint.parametrize({ collection: 'myCollection' })).toEqual('/api/myCollection');
		/* Not sure why you'd do this next one, but let's test it anyway */
		expect(endpoint.parametrize({ id: -42 })).toEqual('/api/-42');
		expect(endpoint.parametrize({})).toEqual('/api');
		expect(endpoint.parametrize()).toEqual('/api/:collection/:id');
	});

});

describe('Testing endpoint request generator', function () {
});

describe('Testing endpoint resource access', function () {
});
