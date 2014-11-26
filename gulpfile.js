var gulp = require('gulp');
var watch = require('gulp-watch');

var path = require('path');

var bower = require('bower');

var jsdoc = require('gulp-jsdoc');
var angularDoc = require('angular-jsdoc');

var uglify - require('gulp-uglify');
var annotate = require('gulp-ng-annotate');

var httpServer = require('http-server');

var srcDir = 'src/';
var outDir = 'out/';
var moduleDir = outDir;
var bundleFile = path.join(outDir, 'bundle.js');
var docDir = path.join(outDir, 'doc');

gulp.task('bundle', ['modules'], function () {
});

gulp.task('modules', function () {
	/* How to ensure:
	 * a) module.js appears first
	 * b) we only rebuild if any source file is newer than the output?
	 * c) we rebuild using ALL source files in the case that (b) is true for any
	 */
	return gulp.src(srcDir + '*/*.js')...
});

gulp.task('docs', function () {
});

gulp.task('syntax', function () {
});

gulp.task('clean', function () {
});

gulp.task('distclean', ['clean'], function () {
});

gulp.task('serve', function () {
});
