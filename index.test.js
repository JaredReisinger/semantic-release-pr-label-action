// const wait = require('./wait');
// const process = require("process");
const proc = require('child_process');
const path = require('path');

describe('action tests', () => {
  // shows how the runner will run a javascript action with env / stdout
  // protocol
  test('run()', async () => {
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
      GITHUB_WORKSPACE: './__test__',
      // 'INPUT_GITHUB-TOKEN': 'TOKEN',
      'INPUT_GITHUB-TOKEN': '97d801b9ef449d86e0ac3cfee52ad8f1bc6f935c',
      'INPUT_PATCH-LABEL': 'PATCH',
      'INPUT_MINOR-LABEL': 'MINOR',
      'INPUT_MAJOR-LABEL': 'MAJOR',
      'INPUT_NO-LABEL': 'NO',
    };

    const file = path.join(__dirname, 'index.js');
    // console.log(proc.execSync(`node ${file}`, {env}).toString());
    // const child = proc.fork(file, [], { env });
    const {
      // code,
      // signal,
      stdout,
      stderr,
    } = await forkAsync(file, [], { env });

    console.log(`STDOUT:\n${stdout.toString()}\nSTDERR:\n${stderr.toString()}`);
  });
  //
  // test('getContext', () => {
  //   const context = index.getContext();
  //   expect(context).toMatchObject({
  //     core: mockCore,
  //     github: mockGithub,
  //     octokit: expect.anything(),
  //     owner: 'OWNER',
  //     repo: 'REPO',
  //     pull_number: 123,
  //   });
  // });
  //
  // test('getCommits', async () => {
  //   const context = index.getContext();
  //   const actual = await index.getCommits(context);
  //   expect(actual).toBe(commits);
  // })
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
