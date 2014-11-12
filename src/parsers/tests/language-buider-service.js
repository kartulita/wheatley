tests.push({
	name: 'language-builder-servie',
	group: 'Parsers',
	modules: ['battlesnake.parsers'],
	test: function (languageBuilderService, comprehensionLanguage) {
	/** @module parsers */

	describe('Language builder', function () {
		
		/*
		 * If you're as big an idiot as me, enable this test suite - see what
		 * happens when you perform a deep comparison between two identical,
		 * recursive (self-referencing) objects.
		 */
		true || it('Generates the comprehension language correctly', function () {

			var spec = {
				capture: { start: '{', end: '}' },
				options: { start: '[', end: ']', subgroups: 'phrase' },
				choice: { start: '|', end: '|' },
				phrase: 'capture,options,choice',
				$root: 'phrase'
			};

			var language = languageBuilderService(spec);

			expect(angular.equals(language, comprehensionLanguage)).to.equal(true);
		});

	});

}});

