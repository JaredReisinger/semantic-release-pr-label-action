// mock fs module...
// const path = require('path');
const pathActual = jest.requireActual('path');
const fsActual = jest.requireActual('fs');

// mockedFiles is a map of files (as a Set?) for a given directory path
let mockedFiles = {};

// files is a map where the keys are paths (which are split to ensure every
// component is tracked), and the values, if they exist, are stub files for
// that directory
function __setMockedFiles(files) {
  mockedFiles = {};
  if (!files) {
    return;
  }

  // TODO: ensure no duplicate entries?
  Object.entries(files).forEach(([key, value]) => {
    // *if* there's a value, set/add it to the key immediately
    if (value) {
      mockedFiles[key] = (mockedFiles[key] || new Set()).add(value);
    }

    let parts = pathActual.parse(key);
    // We expect all files to be "fake-rooted" to 'ROOT', without '/'
    expect(parts.root).toBe('');

    // Now climb the key/path, to ensure that all parent/child entries are
    // tracked.
    while (parts.dir !== '') {
      mockedFiles[parts.dir] = (mockedFiles[parts.dir] || new Set()).add(
        parts.base
      );
      parts = pathActual.parse(parts.dir);
    }
  });

  // console.log(`MOCKED FILES:...`);
  // console.dir(mockedFiles);
}

async function readdir(dir, options) {
  // we don't handle options in tests, so we'd better not be using it!
  expect(options).toBeUndefined();

  const fileSet = mockedFiles[dir];

  if (!fileSet) {
    throw new Error(`UNKNOWN DIRECTORY "${dir}`);
  }

  return [...fileSet];
}

// Somehow the @actions/github initialization is sometimes hitting this...
// perhaps Jest's genMockFromModule() is causing it?  For now, we allow this
// to pass through unscathed.
function existsSync(file) {
  return fsActual.existsSync(file);
}

function readFileSync(file) {
  return fsActual.readFileSync(file);
}

module.exports = {
  promises: {
    readdir,
  },
  existsSync,
  readFileSync,
  __setMockedFiles,
};
