const core = require('@actions/core');
const impl = require('./impl');

// most @actions toolkit packages have async methods
async function run() {
  try {
    const context = impl.getContext();
    // core.debug(JSON.stringify(context));
    // console.dir({ context });
    const commits = await impl.getCommits(context);
    // core.debug(JSON.stringify(commits));
    // console.dir({ commits });
    const result = impl.analyzeCommits(commits, context);
    core.debug(`result: ${JSON.stringify(result)}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

exports = module.exports = {
  run,
};
