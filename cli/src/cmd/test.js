import { Parser } from 'yargs/helpers';
import { rm, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from '../execDocker/docker.js';
import {
  checkDeterministicOutputExists,
  getDeterministicOutputAsText,
} from '../utils/deterministicOutput.js';
import { readIAppConfig } from '../utils/iAppConfigFile.js';
import {
  IEXEC_WORKER_HEAP_SIZE,
  TEST_INPUT_DIR,
  TEST_OUTPUT_DIR,
} from '../config/config.js';
import { getSpinner } from '../cli-helpers/spinner.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';

export async function test({ args }) {
  const spinner = getSpinner();
  try {
    await cleanTestOutput({ spinner });
    await testApp({ args, spinner });
    await checkTestOutput({ spinner });
    await askShowTestOutput({ spinner });
  } catch (error) {
    handleCliError({ spinner, error });
  }
}

async function cleanTestOutput({ spinner }) {
  // just start the spinner, no need to persist success in terminal
  spinner.start('Cleaning output directory...');
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR);
}

function parseArgsString(args = '') {
  // tokenize args with yargs-parser
  const { _ } = Parser(args, {
    configuration: {
      'unknown-options-as-args': true,
    },
  });
  // strip surrounding quotes of tokenized args
  const stripSurroundingQuotes = (arg) => {
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.substring(1, arg.length - 1);
    }
    return arg;
  };
  return _.map(stripSurroundingQuotes);
}

export async function testApp({ args = undefined, spinner }) {
  const iAppConfig = await readIAppConfig();
  const { withProtectedData } = iAppConfig;

  // just start the spinner, no need to persist success in terminal
  spinner.start('Checking docker daemon is running...');
  await checkDockerDaemon();
  // build a temp image for test
  spinner.start('Building app docker image for test...\n');
  const imageId = await dockerBuild({
    isForTest: true,
    progressCallback: (msg) => {
      spinner.text = spinner.text + msg;
    },
  });
  spinner.succeed(`App docker image built (${imageId})`);

  // run the temp image
  spinner.start('Running app docker image...\n');
  const appLogs = [];
  const { exitCode, outOfMemory } = await runDockerContainer({
    image: imageId,
    cmd: parseArgsString(args),
    volumes: [
      `${process.cwd()}/${TEST_INPUT_DIR}:/iexec_in`,
      `${process.cwd()}/${TEST_OUTPUT_DIR}:/iexec_out`,
    ],
    env: [
      `IEXEC_IN=/iexec_in`,
      `IEXEC_OUT=/iexec_out`,
      ...(withProtectedData
        ? [`IEXEC_DATASET_FILENAME=protectedData.zip`]
        : []),
    ],
    memory: IEXEC_WORKER_HEAP_SIZE,
    logsCallback: (msg) => {
      appLogs.push(msg); // collect logs for future use
      spinner.text = spinner.text + msg; // and display realtime while app is running
    },
  });
  if (outOfMemory) {
    spinner.fail(
      `App docker image container ran out of memory.
  iExec worker's ${Math.floor(IEXEC_WORKER_HEAP_SIZE / (1024 * 1024))}Mb memory limit exceeded.
  You must refactor your app to run within the memory limit.`
    );
  } else if (exitCode === 0) {
    spinner.succeed('App docker image ran and exited successfully.');
  } else {
    spinner.warn(
      `App docker image ran but exited with error (Exit code: ${exitCode})
  You may want to check it was intentional`
    );
  }
  // show app logs
  if (appLogs.length === 0) {
    spinner.info("App didn't log anything");
  } else {
    const showLogs = await spinner.prompt({
      type: 'confirm',
      name: 'continue',
      message: `Would you like to see the app logs? (${appLogs.length} lines)`,
    });
    if (showLogs.continue) {
      spinner.info(`App logs:
${appLogs.join('')}`);
    }
  }
}

async function checkTestOutput({ spinner }) {
  spinner.start('Checking test output...');
  const errors = [];
  await checkDeterministicOutputExists().catch((e) => {
    errors.push(e);
  });
  // TODO check output dir size
  if (errors.length === 0) {
    spinner.succeed('Checked app output');
  } else {
    errors.forEach((e) => {
      spinner.fail(e.message);
    });
  }
}

async function askShowTestOutput({ spinner }) {
  // Prompt user to view result
  const continueAnswer = await spinner.prompt({
    type: 'confirm',
    name: 'continue',
    message: `Would you like to see the result? (View ./${TEST_OUTPUT_DIR}/)`,
  });
  if (continueAnswer.continue) {
    const files = await readdir(TEST_OUTPUT_DIR).catch(() => []);
    spinner.newLine();
    if (files.length === 0) {
      spinner.warn('output directory is empty');
    } else {
      spinner.info(
        `output directory content:\n${files.map((file) => '  - ' + file).join('\n')}`
      );
      // best effort display deterministic output file if it's an utf8 encoded file
      await getDeterministicOutputAsText()
        .then(({ text, path }) => {
          spinner.newLine();
          spinner.info(`${path}:\n${text}`);
        })
        .catch(() => {});
    }
  }
}
