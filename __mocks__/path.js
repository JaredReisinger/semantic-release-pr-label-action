// fake path (to hack resolve?)

const path = jest.genMockFromModule('path');
const actualPath = jest.requireActual('path');

path.resolve.mockImplementation(dir => {
  // console.log(`MOCK PATH.RESOLVE(${dir})`);
  expect(dir).toBe('.');
  return 'ROOT';
});

path.join.mockImplementation((...parts) => {
  // console.log(`MOCK PATH.JOIN(${JSON.stringify(parts)})`);
  return actualPath.join(...parts);
});

module.exports = path;
