// encapsulates the github/ocktokit initialization to ease testing
function getContext() {
  const core = require('@actions/core');
  core.debug('getContext');
  const github = require('@actions/github');

  const { pull_request } = github.context.payload;
  const owner = pull_request.base.repo.owner.login;
  const repo = pull_request.base.repo.name;
  const pull_number = pull_request.number;

  const token = core.getInput('github-token', { required: true });

  const octokit = new github.GitHub(token);

  return { core, github, octokit, owner, repo, pull_number };
}

async function getCommits({ core, octokit, owner, repo, pull_number }) {
  core.debug('getCommits');

  const results = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number,
    per_page: 250, // do we need to call again if we get this many?
  });

  // The commits from GitHub are a rich wrapper around the actual git
  // commit, adding GitHub-specific info.  We really just want the ".commit"
  // sub-property.
  const commits = results.data.map(result => result.commit);
  // core.debug(`commit messages: ${JSON.stringify(commits.map(c => c.message))}`);

  return commits;
}

function analyzeCommits(commits, { core }) {
  core.debug('analyzeCommits');
  core.debug(`analyzing ${commits.length} commits...`);
  return false;
}

exports = module.exports = {
  getContext,
  getCommits,
  analyzeCommits,
};
