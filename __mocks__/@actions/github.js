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

let mockedCommits = [];

mockGithub.GitHub.mockImplementation((/* token */) => {
  // expect(token).toBe(inputs['github-token'].value);

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
        return { data: mockedCommits };
      }),
    },
  };
});

function __setMockedCommits(commits) {
  mockedCommits = commits || [];
}

mockGithub.__setMockedCommits = __setMockedCommits;

module.exports = mockGithub;
