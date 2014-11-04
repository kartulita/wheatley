# Directive Proxy Service

A service which proxies directives.

## Example

	angular.module('demo', ['directive-proxy'])
		.directive('tag', tagDirective)
		.directive('loud', loudDirective)
		;

	function tagDirective(directiveProxyService) {
		return directiveProxyService.generateDirective(
			'span',
			function link(scope, element, attrs) {
				var tag = attrs.name;
				directiveProxyService(tag, { 'name': 'remove', 'content': 'remove' }, scope, element, attrs)
					.addClass('proxied')
					.text(attrs.content)
					;
			});
	}

	function loudDirective() {
		return {
			restrict: 'E',
			replace: true,
			template: '<span style="color: red; font-weight: bold;"></span>'
		};
	}

HTML:

	<tag name="loud" content="Loud text"></tag>

Result:

	<span class="proxied">
		<span style="color: red; font-weight: bold;">Loud text</span>
	</span>

## directiveProxyService.generateDirective( tag link [require] )

This function generates a directive definition, something like this:

	{
		restrict: 'E',
		priority: <high>,
		terminal: true,
		replace: true,
		template: '<' + tag + '/>',
		link: link,
		require: require
	}

## directiveProxyService.generateAlias( tag target )

Generates an alias directive, identical to:

	directiveProxyService.generateDirective(
		tag,
		function link(...) => directiveProxyService(target, null, ...)
	);

## directiveProxyService( target attrActions scope element attrs )

This function does the following:

1.	Ensured that the target directive exists (via $injector) and throws if it
	does not.

2.	Generates a HTML element to invoke the target directive.

3.	Transfers attributes from the parent element to the new element, as
	specified by attrActions.

4.	Compiles the HTML element with its attributes.

5.	Appends this new element to the parent element (specified via parameters).

6.	Returns the new element.

### attrActions

Object specifying how attributes are to be transferred:

	{
		'id': 'leave',
		'ng-model': 'move',
		'class': 'copy',
		'target': 'remove',
		'attr': '=value'
	}

 *	**leave**: leave the attribute on the parent element.
 *	**move**: move the attribute to the child element.
 *	**copy**: copy the attribute to the child element.
 *	**remove**: remove the attribute from the parent element.
 *	**=<value>**: set the child attribute to the specified value.

Default: *move* all attributes, except `class` and `id`, which default to *leave*.
