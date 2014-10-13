# Solution structure

## api

For talking to the server.
Wraps `$http` and returns promises.
Exposes endpoints.


## schema

For getting schemas, uses `api`.  Post-processes schemas as needed, e.g. looking
up `validator` functions by name.


## autoform

For generating HTML forms from schemas, uses `schema` and `ui`.


## ui

Facade/factory for creating UI elements.  Elements are identified by "purpose"
rather than "implementation" (e.g. Date, Name, Number, Choice, Category, etc),
and purposes can be specialised.  The factory calls "purpose" directives
to create the UI elements.

These "purposes" choose how they want to be implemented, and use relevant
"implementation" directives to create the needed DOM elements.
Multiple "purposes" may use the same "implementation" where appropriate, e.g.
name [non-empty], ID number [masked], description [no validation] may all use a
"Text box" implementation, with different decorators/validators.

One "purpose" may use multiple implementations, e.g. a "Choice" may use either a
"Radio group", a "Dropdown list", or a "JQuery UI autocomplete" depending on
whether the items should be editable, and how many items there are.

    Facade (takes [name, purpose, validator] as parameters)
	   |
	Purpose (e.g. Date, Positive integer, Choice, Category tree)
	   |
    Implementation (e.g. HTML5 / JQueryUI)


## validator

Validator functions, which are referenced by name in `schemas`.
