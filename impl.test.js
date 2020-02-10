describe('implementation tests', () => {
  const inputs = {
    'github-token': { value: 'TOKEN', required: true },
    'patch-label': { value: 'PATCH', required: true },
    'minor-label': { value: 'MINOR', required: true },
    'major-label': { value: 'MAJOR', required: true },
    'skipped-label': { value: 'SKIPPED', required: false },
    'dry-run': { value: 'true', required: false },
  };

  const commits = [{ message: 'BOGUS' }];

  const {
    mockEnvCi,
    mockGetLogger,
    mockGetConfig,
  } = require('./__mocks__/misc');

  let mockCore, mockGithub;
  let impl;

  beforeAll(() => {
    jest.mock('@actions/core');
    jest.mock('@actions/github');
    jest.mock('path');
    jest.mock('fs');

    mockCore = require('@actions/core');
    mockCore.__setMockedInputs(inputs);

    // The commits from GitHub are a rich wrapper around the actual
    // git commit, adding GitHub-specific info.
    mockGithub = require('@actions/github');
    mockGithub.__setMockedCommits(commits.map(commit => ({ commit })));

    // set up the files we will be looking for...
    require('fs').__setMockedFiles({
      'ROOT/node_modules/env-ci': null,
      'ROOT/node_modules/semantic-release/lib': ['get-logger', 'get-config'],
    });

    // It would be nice to be able to use the __mocks__ auto-mapping for virtual
    // modules (dynamic requires), but in order to pass 'virtual: true', the
    // module factory paramter *must* be provided... so these are inlined, with
    // the implementations loaded from __mocks__/misc.
    jest.mock('ROOT/node_modules/env-ci', () => mockEnvCi, { virtual: true });

    jest.mock(
      'ROOT/node_modules/semantic-release/lib/get-logger',
      () => mockGetLogger,
      { virtual: true }
    );

    jest.mock(
      'ROOT/node_modules/semantic-release/lib/get-config',
      () => mockGetConfig,
      { virtual: true }
    );

    // impl = require(actualPath.join(__dirname, 'impl.js'));
    impl = jest.requireActual('./impl');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('getContext', async () => {
    const context = await impl.getContext('.');
    expect(context).toMatchObject({
      core: mockCore,
      github: mockGithub,
      octokit: expect.anything(),
      owner: 'OWNER',
      repo: 'REPO',
      pull_number: 123,
      getLogger: mockGetLogger,
      getConfig: mockGetConfig,
      envCi: mockEnvCi,
    });
  });

  describe('requireModule()', () => {
    test('finds dynamic module', async () => {
      const result = await impl.__testOnly__.requireModule(
        mockCore,
        '.',
        'node_modules',
        'env-ci'
      );
      expect(result).toBe(mockEnvCi);
    });

    test('throws on missing module', async () => {
      expect.assertions(3);
      await expect(
        impl.__testOnly__.requireModule(
          mockCore,
          '.',
          'node_modules',
          'MISSING'
        )
      ).rejects.toThrow();
    });

    test('throws on missing path part', async () => {
      expect.assertions(3);
      await expect(
        impl.__testOnly__.requireModule(mockCore, '.', 'MISSING', 'UNUSED')
      ).rejects.toThrow();
    });
  });

  test('getCommits', async () => {
    const context = await impl.getContext('.');
    const actual = await impl.getCommits(context);
    expect(actual).toEqual(commits);
  });
});
