var gulp = require('gulp'),
connect = require('gulp-connect'),
open = require('gulp-open'),
concat = require('gulp-concat'),
flatten = require('gulp-flatten'),
port = process.env.port || 3051;

gulp.task('open', function(){
  var options = {
    url: 'http://localhost:' + port,
  };
  gulp.src('./app/index.html')
  .pipe(open('', options));
});

gulp.task('connect', function() {
  connect.server({
    root: 'app',
    port: port,
    livereload: true
  });
});

gulp.task('js', function () {
  gulp.src('./app/dist/**/*.js')
  .pipe(connect.reload());
});

gulp.task('html', function () {
  gulp.src('./app/**/*.html')
  .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch('app/index.html', ['html']);
  gulp.watch('app/src/**/*.js', ['concat', 'js']);
});

gulp.task('bower', function() {
  gulp.src('bower_components/**/*.min.js')
  .pipe(flatten())
  .pipe(gulp.dest('./app/lib/'))
});

gulp.task('concat', function() {
  gulp.src('./app/src/**/*.js')
  .pipe(concat('trends.js'))
  .pipe(gulp.dest('./app/dist/'))
});

gulp.task('default', ['concat', 'bower']);

gulp.task('serve', ['default', 'connect', 'open', 'watch']);
