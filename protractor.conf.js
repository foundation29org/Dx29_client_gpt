// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts
const { SpecReporter } = require('jasmine-spec-reporter');
const jasmineReporters = require("jasmine-reporters");
process.env.CHROME_BIN = process.env.CHROME_BIN || require("puppeteer").executablePath();

const baseUrl = process.env.baseUrl ? process.env.baseUrl : 'http://localhost:4200';

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './e2e/**/*.e2e-spec.ts'
  ],
  capabilities: {
    'browserName': 'chrome',
    chromeOptions: {
      binary: process.env.CHROME_BIN
    }
  },
  directConnect: true,
  baseUrl: baseUrl,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  plugins: [
    {
      package: "protractor-console-plugin",
      failOnWarning: false,
      failOnError: true,
      logWarnings: true
    }
  ],
  beforeLaunch: function() {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
  },
  onPrepare() {
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
    jasmine.getEnv().addReporter(
      new jasmineReporters.JUnitXmlReporter({
        consolidateAll: true,
        savePath: "testresults/junit/",
        filePrefix: "TEST-e2e-results-junit"
      })
    );

  }
};
