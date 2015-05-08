 module.exports = function(config) {
    "use strict";

    config.set({
      frameworks: ['jasmine', 'fixture'],
    
      singleRun: true,

      browsers: ['Firefox', 'Chrome'],

      files: [
        // Vendor files
        'src/test/vendor/*.js',
        'node_modules/jquery/dist/jquery.js',
        'node_modules/datatables/media/js/jquery.dataTables.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'src/lib/js/dataTables.fixedHeader.js',
        'node_modules/jasmine-jquery/lib/jasmine-jquery.js',

        // Helper files
        'src/test/helpers/*.js',
        'build/helpers/*.js',

        // Fixtures
        { pattern: 'src/test/fixtures/html/defaultTemplate.html',
          watched: true,
          served:  true,
          included: false },

        { pattern: 'src/test/fixtures/json/*.json',
          watched: true,
          served:  true,
          included: false },

        // Source code
        'src/js/*.js',

        // Spec files
        'src/test/js/*Spec.js'
      ],

      preprocessors: {
        'src/js/**/*.js': ['coverage']
      },

      exclude: [
        'src/js/main.js'
      ],

      plugins: [
        'karma-jasmine',
        'karma-firefox-launcher',
        'karma-chrome-launcher',
        'karma-phantomjs-launcher',
        'karma-fixture',
        'karma-coverage'
      ],

      reporters: ['progress', 'coverage'],

      coverageReporter: {
        reporters: [ 
          {
            type : 'html',
            dir : 'build/coverage/',
            subdir: 'html'
          },
          {
            type: 'cobertura',
            dir: 'build/coverage',
            subdir: 'xml'
          },
          {
            type: 'json',
            dir: 'build/coverage',
            subdir: 'json'
          },
          {
            type: 'text-summary'
          }
        ]
      }
    });
  };