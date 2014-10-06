# Standards

This document is best viewed through a markdown parser.

## Coding

If in doubt, follow the kernel-style.  The main exception being that the
open-brace for JavaScript/C# functions should _always_ be on the same line:

	function myFunction(param1, param2) {
		myFunctionBody...
	}

 * TAB indent.  That way, I can have 8-width indent, you can have 4-width indent
 and gnoobs can have their god-forsaken 2-space indent.

 * We aren't measured by lines-of-code, so let's not behave like Java devs.
 Opening brace is on SAME line as associated control statement, and
 non-independent control statements are on the same line as the preceeding
 close-brace:

	if (condition) {
		someCommand();
	} else if (otherCondition) {
		someOtherCommand();
	} else {
		anotherCommand();
	}

	do {
		loopCommand();
	} while (condition);

	for (var i = 0; i < 10; i++) {
		loopCommand();
	}

 * More than 4 levels of indentation?  You should probably rethink your
 design...  Pull big anonymous functions out and name/document them, separate
 big controller into many small services/directives.........

 * Line length > 80?  Probably fine for JavaScript/C#, but don't exceed 200, and be worried if you exceed 160...

 * Unit tests / mocks: Besides ensuring that your code actually works, these
 also serve as good demonstrations of how to use your code.  A few small tests
 that can be kept up to date easily are better than a volume of documentation
 that ends up being disorganised and out of date.  Want to add a feature to your
 code?  Why not write the tests for the feature BEFORE writing the code, so that
 you can test each module/object/function as you finish coding them?  This also
 makes it easier for others to help...

## Architecture

### _Do_ hide system features

Use abstraction to hide the implementation from
the interface so that code is easily portable.  A good example is hiding
a date-picker via some directive "ng-datepicker" instead of using any
specific implementation.  The actual implementation of the "ng-datepicker"
directive is then free to use the HTML5 date picker, a JQueryUI one, or
others - and can be changed easily to use others later, without having to
alter all the forms that use the date picker.

Communication to server APIs should be hidden in services where possible,
so that if/when APIs change, the front-end code only needs to be updated in one
place.  This also allows mocking of backends, for test purposes.

### _Do not_ hide language features

If your code is asynchronous and uses a promise, return a proper promise; don't
hide it behind callback functions.  By exposing a promise, callbacks can add
their own error handling when needed. By not encapsulating the error-handler
totally, we allow the caller to use "on done" handlers which care only when the
promise is "done", regardless of whether it was rejected or not.  One example of
this is disabling the "New" button on a form (when clicked) until the create
operation either completes or fails, in order to prevent double-clicks from
creating duplicate items.

	/* BAD */
	function myAsync(params, onSuccess) {
		myApi.get(params)
			.success(function (result) {
				onSuccess(result);
			})
			.error(function (error) {
				myGlobalErrorHandler('myAsync', error);
			});
	}

	/* GOOD */
	function myAsync(params) {
		var future = $q.defer();
		return myApi.get(params)
			.success(function (result) {
				future.resolve(result);
			})
			.error(function (error) {
				myGlobalErrorHandler('myAsync', error);
				future.reject(error);
			})
		return future.promise;
	}

