// Do not use this in production
(function (document) {
	'definitely do not use strict'; // evil eval used for JS loader
	
	// Lazy way to load dependencies when testing:
	// <meta name="dependency" content="underscore">
	
	// This library is:
	//   Insecure (executes foreign JS in current domain)
	//   Slow (no pipelining for scripts)
	//   Hacky (look at it!)
	//
	// It's basically a Microsoft product without the Microsoft.
	//
	// Just do not use it unless you're writing small tests for your own use
	//

	var libraries = { 
		toastr: [
			'//cdnjs.cloudflare.com/ajax/libs/toastr.js/2.0.2/js/toastr.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/toastr.js/2.0.2/css/toastr.min.css'
		],
		underscore: [
			'//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js'
		],
		angular: [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.min.js'
		],
		'angular-mocks': [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-mocks.js'
		],
		'angular-touch': [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-touch.min.js'
		],
		'angular-sanitize': [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-sanitize.min.js'
		],
		'angular-locale': [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/i18n/angular-locale_et.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/i18n/angular-locale_en-gb.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/i18n/angular-locale_ru-ru.min.js'
		],
		'angular-route': [
			'//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-route.min.js'
		],
		'angular-ui': [
			'//cdnjs.cloudflare.com/ajax/libs/angular-ui/0.4.0/angular-ui.min.css',
			'//cdnjs.cloudflare.com/ajax/libs/angular-ui/0.4.0/angular-ui-ieshiv.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/angular-ui/0.4.0/angular-ui.min.js'
		],
		'angular-moment': [
			'//cdnjs.cloudflare.com/ajax/libs/angular-moment/0.8.2/angular-moment.min.js'
		],
		'angular-ui-bootstrap': [
			'//cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap.min.js'
		],
		'angular-ui-sortable': [
			'//cdnjs.cloudflare.com/ajax/libs/angular-ui-sortable/0.13.0/sortable.min.js'
		],
		'jquery': [
			'//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js'
		],
		'jquery-ui': [
			'//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.4/i18n/jquery-ui-i18n.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.4/css/jquery-ui.min.css'
		],
		'jquery-mobile': [
			'//cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.1/jquery.mobile.min.js',
			'//cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.1/jquery.mobile.min.css',
			'//cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.1/jquery.mobile.theme.min.css'
		]
	};

	[].slice.apply(document.getElementsByTagName('meta'))
		.filter(function (el) {
			return el.getAttribute('name') === 'dependency';
		})
		.forEach(function (el) {
			var name = el.getAttribute('content');
			if (!String(name).length) {
				throw new Error('No dependency name specified on <dependency> tag');
			}
			var files = libraries[name];
			if (!files) {
				throw new Error('Unknown dependency: ' + name);
			}
			var html = '<!-- Dependency: ' + name + ' -->' +
				files.map(function (file) {
					var ext = /\.[a-z]+(\?.*)?$/.exec(file);
					if (ext.length === 0) {
						throw new Error('Unknown file type "' + ext + '" in dependency ' + name);
					} else if (ext[0] === '.js') {
						var xhr = new XMLHttpRequest();
						xhr.open('GET', file, false);
						xhr.send();
						if (xhr.status === 200) {
							eval(xhr.responseText);
						} else {
							throw new Error('Failed to load for dependency "' + name + '" script "' + file + '": ' + xhr.status);
						}
						return '<script src="' + file + '"></script>';
					} else if (ext[0] === '.css') {
						return '<link href="' + file + '" rel="stylesheet" type="text/css">';
					}
				})
				.join('');
			var parentEl = el.parentNode;
			var divEl = document.createElement('div');
			divEl.innerHTML = html;
			[].slice.apply(divEl.childNodes).forEach(function (newEl) {
				parentEl.insertBefore(newEl, el.nextSibling);
			});
			parentEl.removeChild(el);
		});

})(document);
