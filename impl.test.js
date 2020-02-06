// const wait = require('./wait');
// const process = require("process");
// const proc = require("child_process");
const path = require('path');

describe('implementation tests', () => {
  const mockCore = jest.genMockFromModule('@actions/core');

  const inputs = {
    'github-token': { value: 'TOKEN', required: true },
  };

  const commits = [{ message: 'BOGUS' }];

  mockCore.getInput.mockImplementation((name, options) => {
    expect(Object.keys(inputs)).toContain(name);

    const { value, required } = inputs[name];
    if (required) {
      expect(options).toMatchObject({ required: true });
    }

    return value;
  });

  const mockGithub = jest.genMockFromModule('@actions/github');

  // add just enough context data for tests...
  mockGithub.context = {
    payload: {
      pull_request: {
        base: {
          repo: {
            owner: {
              login: 'OWNER',
            },
            name: 'REPO',
          },
        },
        number: 123,
      },
    },
  };

  mockGithub.GitHub.mockImplementation(token => {
    expect(token).toBe(inputs['github-token'].value);

    return {
      pulls: {
        listCommits: jest.fn(context => {
          expect(context).toMatchObject({
            owner: 'OWNER',
            repo: 'REPO',
            pull_number: 123,
          });
          // The commits from GitHub are a rich wrapper around the actual
          // git commit, adding GitHub-specific info.
          return { data: commits.map(commit => ({ commit })) };
        }),
      },
    };
  });

  let impl;

  beforeAll(() => {
    jest.setMock('@actions/core', mockCore);
    jest.setMock('@actions/github', mockGithub);
    impl = require(path.join(__dirname, 'impl.js'));
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('getContext', () => {
    const context = impl.getContext();
    expect(context).toMatchObject({
      core: mockCore,
      github: mockGithub,
      octokit: expect.anything(),
      owner: 'OWNER',
      repo: 'REPO',
      pull_number: 123,
    });
  });

  test('getCommits', async () => {
    const context = impl.getContext();
    const actual = await impl.getCommits(context);
    expect(actual).toEqual(commits);
  });
});
