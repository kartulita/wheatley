(function (angular) {
'use strict';

	angular.module('apiModule')
		/* fieldFactory will be in uiModule */
		.factory('fielsetBuilder', function (fieldFactory) {
			/* Builds a form */
			function buildSchema(schema) {
				var result = '';
				var title = schema.title;
				var body = schema.sections.forEach(buildSection);
				return ...;
			}
			/* Builds a section */
			function buildSection(section) {
				var title = section.title;
				var position = section.position;
				var body = section.fields.map(buildField);
				return ...;
			}
			/* Builds a field */
			function buildField(field) {
				var title = field.title;
				var type = field.type;
				var defaultValue = field.defaultValue;
				var body = fieldFactory.create(...);
				return ...;
			}
			/* Exposure */
			return {
				build: buildSchema
			};
		});

})(angular);
