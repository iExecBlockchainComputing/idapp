import { rm, mkdir } from 'node:fs/promises';
import util from 'node:util';
import { exec } from 'child_process';
import inquirer from 'inquirer';
import ora from 'ora';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from './execDocker/docker.js';
import { readIDappConfig } from './utils/idappConfigFile.js';
import {
  IEXEC_WORKER_HEAP_SIZE,
  TEST_INPUT_DIR,
  TEST_OUTPUT_DIR,
} from './config/config.js';
import { handleCliError } from './utils/cli-helpers.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  const spinner = ora();
  try {
    await cleanTestOutput({ spinner });
    await testApp({ args: argv.params, spinner });
    // TODO check output files
    // - output required files
    // - outpout dir size
    await askShowTestOutput({ spinner });
  } catch (error) {
    handleCliError({ spinner, error });
  }
}

async function askShowTestOutput({ spinner }) {
  // Prompt user to view result
  const continueAnswer = await inquirer.prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Would you like to see the result? (View ./output/)',
  });
  if (continueAnswer.continue) {
    // TODO replace with pure nodejs
    const { stdout } = await execAsync('ls output');
    spinner.info(`output directory content: ${stdout.toString()}`);
  }
}

async function cleanTestOutput({ spinner }) {
  // just start the spinner, no need to persist success in terminal
  spinner.start('Cleaning output directory...');
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR);
}

export async function testApp({ args = undefined, spinner }) {
  const idappConfig = await readIDappConfig();
  const { withProtectedData } = idappConfig;

  // just start the spinner, no need to persist success in terminal
  spinner.start('Checking docker daemon is running...');
  await checkDockerDaemon();
  // build a temp image for test
  spinner.start('Building app docker image for test...\n');
  const imageId = await dockerBuild({
    isForTest: true, // Adjust based on your logic
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
    cmd: [args],
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
    spinner.succeed('App docker ran and image exited successfully.');
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
    const showLogs = await inquirer.prompt({
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
