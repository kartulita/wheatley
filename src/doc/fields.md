# Fields

Facade for creating and managing form fields.

 *	Put complexity and ui logic as far away from the HTML/controllers as
	possible (hierarchy of directives).

 *	Encapsulate implementation and provide common interfaces to different
	implementations which serve similar purposes.

 *	Prefer to decorate existing ui controls, rather than creating custom ones.
	This reduces the risk of accessibility and compatability issues.

## Field directive

<field ...></field> or <field:auto ...></field:auto>

A common interface to form fields.

### Purpose attribute

Generally, the actual implementation of the field is of little importance so long
as the field is user-friendly for its desired purpose.  This directive allows
fields to be specified by their *purpose*, and the actual implementation used is
chosen dynamically.  This is particularly useful when automatically generating
forms from database schemas or reflection on DTOs.

You can of course specify an explicit implementation via this directive though if
it does not seem to choose a good one automatically.

The hierarchy is as follows:

 1.	`<field>` or `<field:auto>`, specifying the purpose of the field via the
	`purpose` attribute.

 2.	Purpose directives, e.g. `<field:choice>` for `purpose="choice"`.  These use
	some heuristic to determine which implementation to use.

 3.	Implementation directive, e.g. `<field:radio-group>`.  These represent a
	particular implementation.

For selecting a country, we would typically want a drop-down list or a list-box
as there are many possible choices.  The following directive produces a drop-down.

	<field title="Country" purpose="choice" ng-model="model.country" choices="data.countries"></field>

For selecting a gender, we would typically want a radio-list, since there are few
choices, so a radio-list is more user-friendly than a drop-down.

	<field title="Gender" purpose="choice" ng-model="model.gender" choices="data.genders"></field>

Attributes in this example:

 *	`title` (required): This has no purpose other than to create a visual label
	on the form, for the user.

 *	`ng-model` (required): Usual meaning, the view-model field which is
	data-bound to this ui field.

 *	`purpose` (required): The purpose of the field.  In this case, the purpose is
	to provide a *choice* of values.

 *	`choices` (required for purpose=choice): An array of choices that are
	presented to the user.

The `field` directive proxies to the `field:choice` directive.  This directive
applies a heuristic (in this case, it looks at `choices.length`) to determine
which implementation to use.  For many choices, it proxies to
`field:drop-down-list` and for few choices, it proxies to `field:radio-group`.

The heuristic could also include checking browser details such as screen size,
is the device touch-screen, which implementations are compatible with the browser,
et cetera.  Hence the actual forms do not need to care about client-specific
details, the forms only specify lists of fields and their purposes.  If one day
we find that `jQueryUI-OMGthisWidgetIsAwesome` isn't supported by the browser
that ships with the Banana uPhone 9S, or users on non-touch devices find it
difficult to use, then we can simply edit the heuristics which may generate it in
the relevant purpose directives, rather than having to modify every form
individually.

This also allows optional dependencies, e.g. an implementation directive for the
jQuery UI autocomplete could check if jQuery UI is loaded, and it is not then the
directive could proxy to one which generates a simple text-box instead.

Note that the only practical difference between

	<field title="Country" purpose="choice" ng-model="model.country" choices="data.countries"></field>

and

	<field:choice title="Country" ng-model="model.country" choices="data.countries"></field:choice>

is that the latter does not wrap the field in a `<label>` element (this is done
by the `field` directive).

You may override parameters of the heuristic by giving *hints*:

	<field:choice title="Country" ng-model="model.country" choices="data.countries" hints="many"></field:choice>

This tells the heuristic that there are `many` choices, which will cause it to
choose an implementation suitable for such a use case (e.g. a drop-down list).

Likewise, we could tell it that there are `not many` choices:

	<field:choice title="Country" ng-model="model.country" choices="data.countries" hints="not many"></field:choice>

This will probably result in a radio-group.

We can give multiple hints:

	<field:choice title="Country" ng-model="model.country" choices="data.countries" hints="many,custom"></field:choice>

This specifies to use an implementation which suits `many` choices and `custom`
(i.e. user-provided) choices - such as an autocomplete/typeahead field.

## Demo app (a form)

Dependencies: utils, directive-proxy, fields

### app.js

	angular.module('demoApp', ['fields']);

	angular.module('demoApp')
		.controller('demoController', demoController);

	function demoController($scope) {

		$scope.model = {
			gender: 'M',
			country: 44,
			genders: [],
			countries: [372, 358, 380, 354, 370]
		};

		$scope.data = {
			genders: [
				{ title: 'Male', value: 'M' },
				{ title: 'Female', value: 'F' }
			],
			countries: [
				{ title: 'Estonia', value: 372 },
				{ title: 'UK', value: 44 },
				{ title: 'USA', value: 1 },
				{ title: 'Finland', value: 358 },
				{ title: 'Lithuania', value: 370 },
				{ title: 'France', value: 33 },
				{ title: 'Latvia', value: 371 },
				{ title: 'Iceland', value: 354 },
				{ title: 'Ukraine', value: 380 },
				{ title: 'Belgium', value: 32 }
			]
		};

	}

### index.html

	<!doctype html>
	<html lang="en" ng-app="demoApp">
	<head>
		<meta charset="utf8">
		<title>Test</title>
		<!-- Nice form styles -->
		<link rel="stylesheet" href="sanwebe-style.css">
		<!-- Underscore -->
		<script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js"></script>
		<!-- Angular -->
		<script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.0-beta.13/angular.min.js"></script>
		<!-- Angular bootstrap -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.0/css/bootstrap.min.css">
		<script src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.11.2/ui-bootstrap-tpls.min.js"></script>
		<!-- Module -->
		<script src="utils/module.js"></script>
		<script src="utils/underscore.js"></script>
		<script src="directive-proxy/module.js"></script>
		<script src="directive-proxy/directive-proxy-service.js"></script>
		<script src="fields/module.js"></script>
		<script src="fields/hint-parse-service.js"></script>
		<script src="fields/field-facade.js"></script>
		<script src="fields/choice-facade.js"></script>
		<script src="fields/multichoice-facade.js"></script>
		<script src="fields/drop-down-list-directive.js"></script>
		<script src="fields/fixed-list-directive.js"></script>
		<script src="fields/radio-group-directive.js"></script>
		<script src="fields/multiselect-fixed-list-directive.js"></script>
		<script src="fields/checkbox-group-directive.js"></script>
		<script src="fields/text-box-directive.js"></script>
		<script src="fields/autocomplete-directive.js"></script>
		<!-- Local -->
		<script src="app.js"></script>
		<link rel="stylesheet" href="style.css">
	</head>
	<body ng-controller="demoController">
		<form class="smart-green">
			<h1>Experiment</h1>
			<fieldset>
				<legend>Field purpose specified only</legend>
				<div class="cols">
					<div>
						<fieldset>
							<legend>Choice</legend>
								<field:auto title="Gender" x-purpose="choice" ng-model="model.gender" x-choices="data.genders"></field:auto>
								<field:auto title="Country" x-purpose="choice" ng-model="model.country" x-choices="data.countries"></field:auto>
						</fieldset>
						<fieldset>
							<legend>Multichoice</legend>
							<field:auto title="Genders" x-purpose="multichoice" ng-model="model.genders" x-choices="data.genders" x-hints="optional,many" size="2"></field:auto>
						</fieldset>
					</div>
					<fieldset>
						<legend>Multichoice</legend>
						<field:auto title="Genders" x-purpose="multichoice" ng-model="model.genders" x-choices="data.genders" x-hints="optional"></field:auto>
						<field:auto title="Countries" x-purpose="multichoice" ng-model="model.countries" x-choices="data.countries"></field:auto>
					</fieldset>
				</div>
			</fieldset>
			<fieldset>
				<legend>Specify field purpose with hints</legend>
				<field:auto title="Gender with hint 'many'" x-purpose="choice" x-hints="many" ng-model="model.gender" x-choices="data.genders"></field:auto>
				<field:auto title="Country with hint 'not many'" x-purpose="choice" x-hints="not many" ng-model="model.country" x-choices="data.countries"></field:auto>
				<field:auto title="Country with hint 'custom'" x-purpose="choice" x-hints="many,custom" ng-model="model.country" x-choices="data.countries"></field:auto>
			</fieldset>
			<fieldset>
				<legend>Request specific implementations</legend>
				<field:auto title="Gender as 'text-box'" x-purpose="text-box" ng-model="model.gender" x-choices="data.genders"></field:auto>
				<field:auto title="Country as 'autocomplete'" x-purpose="autocomplete" ng-model="model.country" x-choices="data.countries"></field:auto>
			</fieldset>
			<fieldset>
				<legend>Model</legend>
				<pre>{{ model | json }}</pre>
			</fieldset>
			<fieldset>
				<legend>Data</legend>
				<pre>{{ data | json }}</pre>
			</fieldset>
		</form>
	</body>
	</html>

### style.css

	body {
		padding: 60px;
		background: #333;
	}

	label {
		padding-top: 10px;
	}

	pre {
		white-space: pre-wrap;
	}

	form {
	}

	legend {
		font-size: inherit;
		position: relative;
		left: -10px;
		padding: 0 2px;
		margin: 0;
		border: 0;
		display: inline-block;
		width: auto;
	}

	fieldset {
		display: block;
		border: 0;
		border: 1px solid silver;
		border-radius: 12px;
		padding: 0 10px 10px 20px;
	}

	input,textarea,select {
		box-sizing: border-box;
	}

	fieldset,
	.cols {
		margin-top: 20px;
		margin-bottom: 20px;
	}

	.cols {
		display: flex;
		flex-flow: row nowrap;
		align-items: stretch;
		justify-content: space-between;
	}

	/* TODO: Make a proper .rows class, and get rid of these asterisks */
	.cols>* {
		margin-top: 0;
		margin-bottom: 0;
		flex-grow: 1;
	}
	.cols>*+* {
		margin-left: 20px;
	}

	.cols>*>fieldset:first-child {
		margin-top: 0;
	}

	.cols>*>fieldset:last-child {
		margin-bottom: 0;
	}

	.field {
		margin-top: 10px;
	}

	.field-label {
		text-indent: -8px;
		margin-bottom: 5px;
		font-weight: bold;
		display: block;
		clear: both;
	}

	.field-choicebox-group {
		display: block;
	}

	.field-choicebox-group>.choicebox-item {
		min-width: 80px;
		margin-right: 20px;
		display: inline-block;
		white-space: pre;
	}

	.field-choicebox-group>.choicebox-item>.choicebox-box {
		float: none;
		margin: 0;
		display: inline-block;
		vertical-align: top;
	}

	.field-choicebox-group>.choicebox-item>.choicebox-label {
		margin: 0 0 0 5px;
		display: inline-block;
		float: none;
		vertical-align: top;
	}

	.ng-invalid:not(:focus) {
		box-shadow: 0 0 3px 1px red;
	}

	.field .field-choicebox-group {
		box-shadow: none;
	}

### sanwebe-style.css

	/*
	 * Taken from http://www.sanwebe.com/2013/10/css-html-form-styles, no license
	 * was specified.
	 */
	html,body{
		margin:0px;
		padding:0px;
	}
	h3 {
		text-align: center;
		font-family: georgia;
		color: #727272;
		border-bottom: 1px solid #EEE;
		padding: 5px;
		font-size: x-large;
		margin-top: 50px;
	}
	.smart-green {
		margin-left:auto;
		margin-right:auto;
		max-width: 800px;
		background: #F8F8F8;
		padding: 30px 30px 20px 30px;
		font: 12px Arial, Helvetica, sans-serif;
		color: #666;
		border-radius: 5px;
	}
	.smart-green h1 {
		font: 24px "Trebuchet MS", Arial, Helvetica, sans-serif;
		padding: 20px 0px 20px 40px;
		display: block;
		margin: -30px -30px 10px -30px;
		color: #FFF;
		background: #9DC45F;
		text-shadow: 1px 1px 1px #949494;
		border-radius: 5px 5px 0px 0px;
		border-bottom:1px solid #89AF4C;
	}
	.smart-green h1>span {
		display: block;
		font-size: 11px;
		color: #FFF;
	}
	.smart-green label {
		display: block;
		margin: 0px 0px 5px;
	}
	.smart-green label>span {
		float: left;
		margin-top: 10px;
		color: #5E5E5E;
	}
	.smart-green input[type="text"], .smart-green input[type="email"], .smart-green textarea, .smart-green select {
		color: #555;
		height: 30px;
		line-height:15px;
		width: 100%;
		padding: 0px 0px 0px 10px;
		margin-top: 2px;
		border: 1px solid #E5E5E5;
		background: #FBFBFB;
		outline: 0;
		box-shadow: inset 1px 1px 2px rgba(238, 238, 238, 0.2);
		font: normal 14px/14px Arial, Helvetica, sans-serif;
	}
	.smart-green textarea{
		height:100px;
		padding-top: 10px;
	}
	.smart-green select {
		text-indent: 0.01px;
		text-overflow: '';
		width:100%;
		height:30px;
	}
	.smart-green .button {
		background-color: #9DC45F;
		border-radius: 5px;
		border: none;
		padding: 10px 25px 10px 25px;
		color: #FFF;
		text-shadow: 1px 1px 1px #949494;
	}
	.smart-green .button:hover {
		background-color:#80A24A;
	}

