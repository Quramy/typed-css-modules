'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');

gulp.task('compile', () => {
  return gulp.src('src/**/*.js')
    .pipe(plumber())
    .pipe(babel({presets: ['es2015']}))
    .pipe(gulp.dest('lib'))
    ;
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['compile']);
});
