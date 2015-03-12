(function () {
	'use strict';

	if (Number(location.port) === 2302) {
		window.onerror = function (msg, url, line, col, err) {
			alert([url, 'Line: ' + line, 'Col: ' + col, 'Message: ' + msg].join('\n'));
		};
	}

})();
