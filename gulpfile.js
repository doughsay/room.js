var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , jshint = require('gulp-jshint')

var SRC     = './src'
  , SERVER  = SRC + '/server.js'
  , NODEMON = { script: SERVER
              , env: { 'NODE_ENV': 'development' }
              , nodeArgs: ['--harmony']
              , watch: [SRC]
              }

gulp.task('lint', function() {
  return gulp.src(SRC + '/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
})

gulp.task('dev', function () {
  nodemon(NODEMON) //.on('change', ['lint'])
})
