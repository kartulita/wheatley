(function (angular) {
	'use strict';

	angular.module('fields')
		.directive('fieldAutocomplete', autocompleteDirective);

	function autocompleteDirective(directiveProxyService, hintParseService) {
		if (!uiBootstrap) {
			return directiveProxyService.generateAlias('div', 'field:text-box');
		}
		return {
			restrict: 'E',
			replace: true,
			template:
				'<input class="field-autocomplete" type="text" ' +
				'typeahead="choice.value as choice.title for choice in choices | filter: { title: $viewValue }">',
			scope: {
				choices: '='
			},
			link: function (scope, element, attrs) {
				var hints = hintParseService.parse(attrs.hints, 
					{
						custom: true
					});
				element.attr('contenteditable', hints.custom);
			}
		};
	}

	var uiBootstrap;
	try {
		uiBootstrap = !!angular.module('ui.bootstrap');
	} catch (e) {
		uiBootstrap = false;
	}

	/* http://stackoverflow.com/a/25292180/1156377 */
	angular.module("template/typeahead/typeahead-popup.html", [])
		.run(function($templateCache) {
			$templateCache.put("template/typeahead/typeahead-popup.html",
					"<ul class=\"dropdown-menu\" ng-show=\"isOpen()\" ng-style=\"{top: position.top+'px', left: position.left+'px'}\" style=\"display: block;\" role=\"listbox\" aria-hidden=\"{{!isOpen()}}\">\n" +
					"    <li ng-repeat=\"match in matches track by $index\" ng-class=\"{active: isActive($index) }\" ng-mouseenter=\"selectActive($index)\" ng-click=\"selectMatch($index)\" role=\"option\" id=\"{{match.id}}\">\n" +
					"        <div typeahead-match index=\"$index\" match=\"match\" query=\"query\" template-url=\"templateUrl\"></div>\n" +
					"    </li>\n" +
					"</ul>");
		});


})(window.angular);

