# Building

This solution uses a makefile.  The makefile recognises the following commands:

 *	`make all`: Makes: bundle, modules, docs.

 *	`make bundle`: Builds the modules if needed, then combines them to make
 	`bundle.js`.

 *	`make modules`: Builds the modules.

 *	`make docs`: Converts the markdown documentation in `/src/doc` to HTML
 	documentation in `/doc`, and exports the demos to `/doc/demos`.  Combines the
	HTML docs into one file and adds docpage template.

 *	`make tags`: Generates HTML tags which can be used to include the
 	scripts, either as a bundle, as modules, or as the original sources.
 	They are written to the `/tags` folder, and echoed to the terminal.

 *	`make text`: Builds the tests and serves them via HTTP on port 1337.

 *	`make syntax`: Syntax-checks all the source files.

 *	`make clean`: Removes the temporary directory and output directories and
 	their contents.

 *	`make deps`: Installs the build dependencies (globally, via npm).

## Build process

The makefile looks in the `src` directory for modules.  A module is a folder
which contains a `module.js` file.  A typical `module.js` looks like this:

	(function () {
		'use strict';
		
		angular.module('arbuus', ['climate'])
			.constant('arbuus_colour', 'green')
			.constant('arbuus_shape', 'round')
			;

	})();

If a `module.js` file is found, then that folder is assumed to contain a module,
and is processed by the makefile.  The makefile runs the following operations:

 1.	Concatenate all the sources (*.js) in the module folder (non-recursive).
 
 2.	Passes the result through `ng-annotate`, which generates injector
 	annotations.
 
 3.	If TEST is not defined in the environment, then the result is beautified
 	by `uglifjs`.  Otherwise, it is compressed+mangled+uglified by
 	`uglifyjs`.
 
 4.	The result is stored in the `out` folder, and is names after the module.
 
 5.	All modules are concatenated and uglified (as in step 3) to produce a
	single `bundle.js`.

Example: `make all` or `make`
Test mode: `make TEST=1`

## Directory structure

The directory structure is initially:

	makefile
	build/
		[build scripts]
		docpage/
			[github:battlesnake/docpage]
	src/
		doc/
			[some-doc.md]
			demo.sh
			md2demo.pl
		my-module/
			module.js
			service.js
			other-service.js
		another-module/
			module.js
			some-factory.js

And after running `make`, the following structure is added:

	out/
		my-module.js
		another-module.js
		bundle.js
	tmp/
		[temp files]
	doc/
		index.html
		[docpage dependencies]
		[some-doc.html]
		demos/
			[some-doc]/
				[demo files]
	html/
		sources.html
		modules.html
		bundle.html
	src/
		doc/
			doc-demos/
				[some-doc]/
					[demo files]

## HTML tags

The `bundle.html` file contains a tag for including the `bundle.js` file.
The `modules.html` file contains tags for including all the processed modules
individually.
The `sources.html` file contains tags for including all the original source
files.

To specify a prefix for the script names in the tags files, run
`make tags [PREFIX=prefix]`.  For example, if you want to test against your
original sources, and they will be accessed from `//localhost:4000/scripts/src`
then run:

	make tags PREFIX=//localhost:4000/scripts/src/

And import the contents of `html/sources.html` in your page templates.  ** The
trailing slash on the PREFIX is required. **
