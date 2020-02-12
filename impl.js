const path = require('path');
const fs = require('fs').promises;

// encapsulates the github/ocktokit initialization to ease testing
// NOTE: will also find semantic-release modules?
async function getContext(workspace) {
  const core = require('@actions/core');
  core.debug('getContext');
  const github = require('@actions/github');

  const { pull_request } = github.context.payload;
  const owner = pull_request.base.repo.owner.login;
  const repo = pull_request.base.repo.name;
  const pull_number = pull_request.number;

  // const token = core.getInput('github-token', { required: true });
  const { token, labels, dryRun } = getInputs(core);

  const octokit = new github.GitHub(token);

  // load semantic-release components *from the calling repository*
  // may require running npm install?
  // const workspace = path.resolve(process.env.GITHUB_WORKSPACE);
  const { getLogger, getConfig, envCi } = await getSemanticReleaseModules(
    workspace,
    core
  );

  return {
    core,
    github,
    octokit,
    labels,
    dryRun,
    owner,
    repo,
    pull_number,
    getLogger,
    getConfig,
    envCi,
  };
}

function getInputs(core) {
  const token = core.getInput('github-token', { required: true });

  const patch = core.getInput('patch-label', { required: true });
  const minor = core.getInput('minor-label', { required: true });
  const major = core.getInput('major-label', { required: true });
  const skipped = core.getInput('skipped-label');

  const dryRun = core.getInput('dry-run') || false;

  const labels = {
    patch,
    minor,
    major,
    skipped,
  };

  return { token, labels, dryRun };
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

async function analyzeCommits(commits, { core, getLogger, getConfig, envCi }) {
  core.debug(`analyzeCommits (with ${commits.length} commits)`);

  // // load semantic-release components *from the calling repository*
  // // may require running npm install?
  // const workspace = path.resolve(process.env.GITHUB_WORKSPACE);

  // const { getLogger, getConfig, envCi } = await getSemanticReleaseModules(
  //   workspace,
  //   core
  // );

  const result = await useSemanticReleaseAnalysis(
    commits,
    getLogger,
    getConfig,
    envCi
  );

  // core.debug(`result: ${result}`);
  return result;
}

// encapsulate the dynamic module loading (should this move into getContext?)
async function getSemanticReleaseModules(workspace, core) {
  const getLogger = await requireModule(
    core,
    workspace,
    'node_modules',
    'semantic-release',
    'lib',
    'get-logger'
  );
  const getConfig = await requireModule(
    core,
    workspace,
    'node_modules',
    'semantic-release',
    'lib',
    'get-config'
  );
  const envCi = await requireModule(core, workspace, 'node_modules', 'env-ci');

  return { getLogger, getConfig, envCi };
}

async function useSemanticReleaseAnalysis(
  commits,
  getLogger,
  getConfig,
  envCi
) {
  const cwd = process.cwd();
  const env = process.env;

  const context = {
    cwd,
    env,
    stdout: process.stdout,
    stdin: process.stdin,
    envCi: envCi({ env, cwd }),
  };
  context.logger = getLogger(context);

  const opts = {};

  // console.log("CONTEXT...");
  // console.dir({...context, env: '[REDACTED]'});

  context.logger.log("Loading project's semantic-release config...");
  const { plugins, options } = await getConfig(context, opts);
  // context.logger.log("Loaded semantic-release config:");
  // console.dir({ plugins, options });

  context.options = options;
  context.commits = commits;

  context.logger.log('Analyzing commits...');
  const result = await plugins.analyzeCommits(context);
  // core.debug(`result: ${result}`);

  return result;
}

// attempts to require() a module from the workspace directory, checking each step
// to help diagnose problems.  The last component is not checked, as it could be
// a directory (containing index.js) or it might be a JS file itself.
async function requireModule(core, root, ...paths) {
  // core.debug(`looking for ${JSON.stringify(paths)} in "${root}"`);

  let checkDir = path.resolve(root);

  const dirs = paths.slice(0, -1);
  const file = paths.slice(-1)[0];

  for (const dir of dirs) {
    // core.debug(`looking for "${dir}" in "${checkDir}"`);
    if (!(await fs.readdir(checkDir)).includes(dir)) {
      throw new Error(`No "${dir}" found in "${checkDir}".`);
    }
    checkDir = path.join(checkDir, dir);
  }

  // If we got this far, we appear to have semantic-release components available!
  const component = require(path.join(checkDir, file).toString());
  // console.dir(component);
  if (!component) {
    throw new Error(`Unable to load ${JSON.stringify(paths)} from "${root}".`);
  }

  return component;
}

function labelFromAnalysis(result, { core, labels }) {
  core.debug(`labelFromAnalysis(${JSON.stringify(result)})`);
  core.debug(`looking in ${JSON.stringify(labels)}`);
  let label = labels[result] || labels['skipped'] || null;
  core.debug(`found label ${JSON.stringify(label)}`);
  return label;
}

async function addLabel(
  label,
  { core, octokit, labels, dryRun, owner, repo, pull_number }
) {
  const knownLabels = Object.values(labels);
  core.debug(`adding label "${label}" (from ${JSON.stringify(knownLabels)})`);

  // remove all the release labels, ignoring any 404 errors, and then add the
  // correct one.  (perhaps not as efficient as only removing them when present,
  // but much easier...
  core.debug('removing known labels...');
  await Promise.all(
    knownLabels.map(async name => {
      if (dryRun) {
        core.info(`DRY-RUN: would have removed "${name}"`);
        return false;
      }

      // we don't care about failures here!
      try {
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: pull_number,
          name,
        });
        core.debug(`removed label "${name}"`);
        return true;
      } catch (error) {
        core.debug(`ignoring error "${error.message}" for "${name}"`);
        return false;
      }
    })
  );

  core.info(`adding "${label}" label...`);
  if (dryRun) {
    core.info(`DRY-RUN: would have added "${label}"`);
  } else {
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: pull_number,
      labels: [label],
    });
  }
}

exports = module.exports = {
  getContext,
  getCommits,
  analyzeCommits,
  labelFromAnalysis,
  addLabel,
  __testOnly__: {
    requireModule,
  },
};
