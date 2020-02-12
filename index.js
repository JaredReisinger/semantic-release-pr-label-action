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
    const resultOutput = result || 'no-release';
    // core.debug(`result: ${JSON.stringify(result)}`);
    // output the analysis result:
    core.info(`setting "semantic-release-result" output to "${resultOutput}"`);
    core.setOutput('semantic-release-result', resultOutput);

    const label = impl.labelFromAnalysis(result, context);
    core.info(`setting "label" output to "${label}"`);
    core.setOutput('label', label);

    await impl.addLabel(label, context);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

exports = module.exports = {
  run,
};
