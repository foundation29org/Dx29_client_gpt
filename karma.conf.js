// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html
// Prueba release
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-junit-reporter'),
      require('karma-coverage')
    ],
    client:{
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: false,
      }
    },
    files: [
      
    ],
    preprocessors: {
      
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'), reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    
    /*reporters: config.angularCli && config.angularCli.codeCoverage
              ? ['progress', 'coverage-istanbul']
              : ['progress', 'kjhtml'],*/
    reporters: ['progress', 'kjhtml','coverage', 'junit'],
    junitReporter: {
      outputDir: 'testresults/junit/',
      outputFile: 'TEST-unit-test-result.xml',
      useBrowserName: false
    },
    coverageReporter: {
      type : 'cobertura',
      dir : 'testresults/',
      subdir:'coverage',
      file: 'code-coverage.xml'
    },
    failOnEmptyTestSuite: false,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'], // ChromeHeadless for pipelines. If you want to run test local: use Chrome better
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-extensions', '--remote-debugging-port=9222']
      }
    },
    singleRun: false
  });
};
