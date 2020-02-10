const path = require('path');
const core = require('@actions/core');
const impl = require('./impl');

// most @actions toolkit packages have async methods
async function run() {
  try {
    const context = await impl.getContext(
      path.resolve(process.env.GITHUB_WORKSPACE)
    );
    // core.debug(JSON.stringify(context));
    // console.dir({ context });
    const commits = await impl.getCommits(context);
    // core.debug(JSON.stringify(commits));
    // console.dir({ commits });
    const result = await impl.analyzeCommits(commits, context);
    // core.debug(`result: ${JSON.stringify(result)}`);
    const label = impl.labelFromAnalysis(result, context);
    await impl.addLabel(label, context);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

exports = module.exports = {
  run,
};
