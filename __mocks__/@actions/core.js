const mockCore = jest.genMockFromModule('@actions/core');

// const inputs = {
//   'github-token': { value: 'TOKEN', required: true },
// };

// const commits = [{ message: 'BOGUS' }];

let mockedInputs = {};

mockCore.getInput.mockImplementation((name, options) => {
  expect(Object.keys(mockedInputs)).toContain(name);

  const { value, required } = mockedInputs[name];
  if (required) {
    expect(options).toMatchObject({ required: true });
  }

  return value;
});

function __setMockedInputs(inputs) {
  mockedInputs = inputs || {};
}

mockCore.__setMockedInputs = __setMockedInputs;

module.exports = mockCore;
