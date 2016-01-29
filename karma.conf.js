 module.exports = function(config) {
    "use strict";

    config.set({
      frameworks: ['jasmine', 'fixture'],

      singleRun: true,

      browsers: ['Firefox', 'Chrome'],

      files: [
        // PhantomJS polyfill
          'node_modules/phantomjs-polyfill/bind-polyfill.js',
          'node_modules/babel-polyfill/dist/polyfill.min.js',

        // Vendor files
        'src/test/vendor/*.js',
        'node_modules/jquery/dist/jquery.js',
        'node_modules/datatables/media/js/jquery.dataTables.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'src/lib/js/dataTables.fixedHeader.js',
        'node_modules/jasmine-jquery/lib/jasmine-jquery.js',

        // Helper files
        'src/test/helpers/*.js',

        // Fixtures
        { pattern: 'src/test/fixtures/html/*.html',
          watched: true,
          served:  true,
          included: false },

        { pattern: 'src/test/fixtures/json/*.json',
          watched: true,
          served:  true,
          included: false },

          'src/lib/js/OStackAuth.js',

        // Source code
        'src/js/Utils.js',
        'src/js/Region.js',
        'src/js/UI.js',
        'src/js/ListVolume.js',

        // Spec files
        'src/test/js/*Spec.js'
      ],

      preprocessors: {
          'src/js/**/*.js': ['coverage'],
          'src/lib/js/OStackAuth.js': ['babel']
      },

        babelPreprocessor: {
            options: {
                presets: ['es2015'],
                sourceMap: 'inline'
            },
            filename: function (file) {
                return file.originalPath.replace(/\.js$/, '.es5.js');
            },
            sourceFileName: function (file) {
                return file.originalPath;
            }
        },

      exclude: [
        'src/js/main.js'
      ],

      // plugins: [
      //   'karma-jasmine',
      //   'karma-firefox-launcher',
      //   'karma-chrome-launcher',
      //   'karma-phantomjs-launcher',
      //   'karma-fixture',
      //   'karma-junit-reporter',
      //   'karma-coverage'
      // ],

      reporters: ['progress', 'junit', 'coverage'],

      junitReporter: {
        outputDir: 'build/test-reports'
      },

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
