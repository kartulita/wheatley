(function () {
'use strict';

	angular.module('apiModule')
		.factory('autoformService', function (schemaService, fieldsetBuilder, formDecorator) {
			/* Gets a schema and uses it to render a form */
			function makeAutoform(schemaName, onSave, model) {
				return schemaService.get(schemaName)
					.then(function (data, status) {
						var form = fieldsetBuilder.build(data);
						/* TODO: Decorate */
						var form = formDecorator.decorate(form, onSave);
						/* TODO: Bind? */
						return form;
					});
			}
			/* Exposure */
			return {
				makeAutoform: makeAutoform
			};
		});

}());
