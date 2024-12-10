import { Parser } from 'yargs/helpers';
import { rm, mkdir } from 'node:fs/promises';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from '../execDocker/docker.js';
import { checkDeterministicOutputExists } from '../utils/deterministicOutput.js';
import { readIAppConfig } from '../utils/iAppConfigFile.js';
import {
  IEXEC_WORKER_HEAP_SIZE,
  TEST_INPUT_DIR,
  TEST_OUTPUT_DIR,
} from '../config/config.js';
import { getSpinner } from '../cli-helpers/spinner.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';
import { prepareInputFile } from '../utils/prepareInputFile.js';
import { askForAppSecret } from '../cli-helpers/askForAppSecret.js';
import { askShowResult } from '../cli-helpers/askShowResult.js';

export async function test({
  args,
  inputFile: inputFiles = [], // rename variable (it's an array)
  requesterSecret: requesterSecrets = [], // rename variable (it's an array)
}) {
  const spinner = getSpinner();
  try {
    await cleanTestOutput({ spinner });
    await testApp({ args, inputFiles, requesterSecrets, spinner });
    await checkTestOutput({ spinner });
    await askShowResult({ spinner, outputPath: TEST_OUTPUT_DIR });
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

export async function testApp({
  args = undefined,
  inputFiles = [],
  requesterSecrets = [],
  spinner,
}) {
  const iAppConfig = await readIAppConfig();
  const { withProtectedData } = iAppConfig;

  const appSecret = await askForAppSecret({ spinner });

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

  let inputFilesPath;
  if (inputFiles.length > 0) {
    spinner.start('Preparing input files...\n');
    inputFilesPath = await Promise.all(
      inputFiles.map((url) => prepareInputFile(url))
    );
    spinner.succeed('Input files prepared for test');
  }

  // run the temp image
  spinner.start('Running app docker image...\n');
  const appLogs = [];
  const { exitCode, outOfMemory } = await runDockerContainer({
    image: imageId,
    cmd: parseArgsString(args), // args https://protocol.docs.iex.ec/for-developers/technical-references/application-io#args
    volumes: [
      `${process.cwd()}/${TEST_INPUT_DIR}:/iexec_in`,
      `${process.cwd()}/${TEST_OUTPUT_DIR}:/iexec_out`,
    ],
    env: [
      `IEXEC_IN=/iexec_in`,
      `IEXEC_OUT=/iexec_out`,
      // dataset env https://protocol.docs.iex.ec/for-developers/technical-references/application-io#dataset
      ...(withProtectedData
        ? [`IEXEC_DATASET_FILENAME=protectedData.zip`]
        : []),
      // input files env https://protocol.docs.iex.ec/for-developers/technical-references/application-io#input-files
      `IEXEC_INPUT_FILES_NUMBER=${inputFilesPath?.length || 0}`,
      ...(inputFilesPath?.length > 0
        ? inputFilesPath.map(
            (inputFilePath, index) =>
              `IEXEC_INPUT_FILE_NAME_${index + 1}=${inputFilePath}`
          )
        : []),
      // requester secrets https://protocol.docs.iex.ec/for-developers/technical-references/application-io#requester-secrets
      ...(requesterSecrets?.length > 0
        ? requesterSecrets.map(
            ({ key, value }) => `IEXEC_REQUESTER_SECRET_${key}=${value}`
          )
        : []),
      // app secret https://protocol.docs.iex.ec/for-developers/technical-references/application-io#app-developer-secret
      ...(appSecret !== null
        ? [`IEXEC_APP_DEVELOPER_SECRET=${appSecret}`]
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
  await checkDeterministicOutputExists({ outputPath: TEST_OUTPUT_DIR }).catch(
    (e) => {
      errors.push(e);
    }
  );
  // TODO check output dir size
  if (errors.length === 0) {
    spinner.succeed('Checked app output');
  } else {
    errors.forEach((e) => {
      spinner.fail(e.message);
    });
  }
}
