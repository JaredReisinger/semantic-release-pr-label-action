// unlike the auto-detected mocks, this is the implemention for the virtual mocks that support the dynamic semantic-release module.

const mockEnvCi = jest.fn(() => {
  // no-op!
  console.log('MOCK ENV CI');
});

const mockGetLogger = jest.fn(() => {
  // no-op!
  console.log('MOCK GET LOGGER');
});

const mockGetConfig = jest.fn(async () => {
  // no-op!
  console.log('MOCK GET CONFIG');
  // has to return { plugins: { analyzeCommits: fn }}
});

module.exports = {
  mockEnvCi,
  mockGetLogger,
  mockGetConfig,
};
