// console.log('USING JEST CONFIG!');

const { defaults } = require('jest-config');

// console.log('DEFAULTS:');
// console.dir(defaults);

const config = {
  ...defaults,
  // collectCoverage: true,
  collectCoverageFrom: ['**/*.js'],
  forceCoverageMatch: ['**/*.test.js'],
  coveragePathIgnorePatterns: [
    ...defaults.coveragePathIgnorePatterns,
    '/coverage/',
    '/dist/',
    'jest.config.js',
  ],
};

// console.log('NEW CONFIG:');
// console.dir(config);

module.exports = config;
