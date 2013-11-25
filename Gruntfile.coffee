config = require './app/config/app'

module.exports = (grunt) ->
  grunt.initConfig {

    # clean up compiled or temporary files
    clean:
      pre: ['public/*']
      pre_images: ['public/img/*']
      post: ['tmp/*']

    # copy static assets into public/
    copy:
      images:
        expand: true
        cwd: 'app/assets/img/'
        src: '**'
        dest: 'public/img/'
      fontAwesome:
        expand: true
        cwd: 'bower_components/font-awesome/font/'
        src: '*'
        dest: 'public/font/'
      aceCloudsTheme:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'theme-clouds.js',
        dest: 'public/'
      aceJSONmode:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'mode-json.js',
        dest: 'public/'
      aceCoffeeMode:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'mode-coffee.js',
        dest: 'public/'
      aceJsMode:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'mode-javascript.js',
        dest: 'public/'
      aceCoffeeWorker:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'worker-coffee.js',
        dest: 'public/'
      aceJsWorker:
        expand: true
        cwd: 'bower_components/ace-builds/src/'
        src: 'worker-javascript.js',
        dest: 'public/'

    # compile coffeescript files
    coffee:
      compile:
        expand: true
        cwd: 'app/assets/scripts/'
        src: ['**/*.coffee']
        dest: 'tmp/coffee_output/'
        ext: '.js'

    # compile less files
    less:
      client:
        options:
          paths: [
            'bower_components/flatstrap/assets/less',
            'bower_components/font-awesome/less'
          ]
          compress: config.env is 'production'
        files:
          'tmp/less_output/client.css': 'app/assets/styles/client.less'
      editor:
        options:
          paths: [
            'bower_components/flatstrap/assets/less',
            'bower_components/font-awesome/less'
          ]
          compress: config.env is 'production'
        files:
          'tmp/less_output/editor.css': 'app/assets/styles/editor.less'

    # concatenate js files
    concat:
      options:
        separator: ';'
      app_top_js:
        src: [
          'bower_components/modernizr/modernizr.js'
        ]
        dest: 'public/js/app_top.js'
      client_js:
        src: [
          'bower_components/es5-shim/es5-shim.js',
          'bower_components/jquery/jquery.js',
          'bower_components/flatstrap/assets/js/bootstrap.js',
          'bower_components/knockout.js/knockout.debug.js',
          'bower_components/store.js/store.js',

          'node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js',

          'tmp/coffee_output/lib/knockout-modal.js',
          'tmp/coffee_output/client-view-models/modal-form.js',
          'tmp/coffee_output/client-view-models/client.js',

          'tmp/coffee_output/lib/toasty.js',
        ]
        dest: 'public/js/client.js'
      editor_js:
        src: [
          'bower_components/es5-shim/es5-shim.js',
          'bower_components/jquery/jquery.js',
          'bower_components/jquery-ui/ui/jquery-ui.js',
          'vendor_components/jquery-layout/jquery-layout.js',
          'bower_components/flatstrap/assets/js/bootstrap.js',
          'bower_components/underscore/underscore.js',
          'bower_components/knockout.js/knockout.js',
          'bower_components/knockout-sortable/build/knockout-sortable.js',
          'bower_components/bootbox/bootbox.js',
          'bower_components/toastr/toastr.js',
          'bower_components/ace-builds/src/ace.js',

          'node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js',

          'tmp/coffee_output/lib/knockout-layout.js',
          'tmp/coffee_output/lib/knockout-context.js',

          'tmp/coffee_output/editor-view-models/editor.js',
          'tmp/coffee_output/editor-view-models/tree-node.js',
          'tmp/coffee_output/editor-view-models/object.js',
          'tmp/coffee_output/editor-view-models/tab.js'
        ]
        dest: 'public/js/editor.js'
      client_css:
        options:
          separator: '\n'
        src: ['tmp/less_output/client.css']
        dest: 'public/css/client.css'
      editor_css:
        options:
          separator: '\n'
        src: [
          'tmp/less_output/editor.css',
          'bower_components/toastr/toastr.css'
        ]
        dest: 'public/css/editor.css'

    # uglifyjs files
    uglify:
      app_top:
        src: 'public/js/app_top.js'
        dest: 'public/js/app_top.js'
      editor:
        src: 'public/js/editor.js'
        dest: 'public/js/editor.js'
      client:
        src: 'public/js/client.js'
        dest: 'public/js/client.js'

    watch:
      scripts:
        files: ['app/assets/scripts/**/*.coffee']
        tasks: ['coffee', 'concat:app_top_js', 'concat:client_js', 'concat:editor_js', 'clean:post']

      styles:
        files: ['app/assets/styles/**/*.less']
        tasks: ['less', 'clean:post']

      images:
        files: ['app/assets/img/**']
        tasks: ['clean:pre_images', 'copy:images']

      templates:
        files: ['app/views/**']
        options: livereload: true

      livereload:
        files: ['public/**/*']
        options: livereload: true

      gruntfile:
        files: 'Gruntfile.coffee'
        tasks: ['deploy-assets']
  }

  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'deploy-assets', [
    'clean:pre',
    'copy',
    'less',
    'coffee',
    'concat',
    'clean:post'
  ]

  grunt.registerTask('default', [
    'deploy-assets',
    'watch'
  ])
