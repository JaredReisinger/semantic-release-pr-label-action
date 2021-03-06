// const wait = require('./wait');
// const process = require("process");
const proc = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

describe.skip('action tests', () => {
  // shows how the runner will run a javascript action with env / stdout
  // protocol
  test.skip('run()', async () => {
    const env = {
      ...process.env,
      // set github env vars (see https://github.com/actions/toolkit/blob/master/packages/github/src/context.ts)
      GITHUB_ACTION: 'run1',
      // GITHUB_ACTIONS: 'true', //?
      GITHUB_ACTOR: 'JaredReisinger',
      GITHUB_BASE_REF: 'master',
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_EVENT_PATH: './__test__/event.json',
      GITHUB_HEAD_REF: 'pr-test',
      GITHUB_REF: 'refs/pull/1/merge',
      // GITHUB_REPOSITORY: 'JaredReisinger/semantic-release-pr-label-action',
      GITHUB_REPOSITORY: 'JaredReisinger/action-sandbox',
      GITHUB_RUN_ID: '34748518',
      GITHUB_RUN_NUMBER: '10',
      // GITHUB_SHA: '50606bf40bf3f94ec1b00a4a5f311e1106259e8e',
      GITHUB_SHA: '703be188a57b243ff790f8b9606f3749855e8949',
      GITHUB_WORKFLOW: 'Pull Request',
      GITHUB_WORKSPACE: '.',
      // 'INPUT_GITHUB-TOKEN': 'TOKEN COMES FROM .env FILE or CI PIPELINE!',
      'INPUT_PATCH-LABEL': 'release: fix',
      'INPUT_MINOR-LABEL': 'release: feature',
      'INPUT_MAJOR-LABEL': 'release: BREAKING',
      'INPUT_SKIPPED-LABEL': 'release: skipped',
      'INPUT_DRY-RUN': 'true',
    };

    const file = path.join(__dirname, 'index.js');

    const {
      // code,
      // signal,
      stdout,
      stderr,
    } = await forkAsync(file, [], { env });

    console.log(`STDOUT:\n${stdout.toString()}\nSTDERR:\n${stderr.toString()}`);
  });
});

// The template repo gets the "invoke the app" logic all wrong, and the test
// fails almost as soon as you start doing anything "interesting".  The
// forkAsync() function below is a promisified `child_process.fork()` with
// stdout and stderr captured and passed in the promise resolution along with
// the existing code and signal.
function forkAsync(moduleName, args, opts) {
  opts = { ...opts, stdio: ['inherit', 'pipe', 'pipe', 'ipc'] };

  let stdout = Buffer.from('');
  let stderr = Buffer.from('');

  return new Promise((resolve, reject) => {
    const child = proc.fork(moduleName, args, opts);

    child.stdout.on('data', data => {
      stdout = Buffer.concat([stdout, data]);
    });

    child.stderr.on('data', data => {
      stderr = Buffer.concat([stderr, data]);
    });

    child.on('exit', (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });

    child.on('error', err => {
      // Appending 'stdout' and 'stderr' to the error so that they can be
      // referenced and/or output by the error handler.
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    });
  });
}
