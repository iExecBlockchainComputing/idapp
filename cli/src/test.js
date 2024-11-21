import { rm, mkdir } from 'node:fs/promises';
import util from 'node:util';
import chalk from 'chalk';
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

const execAsync = util.promisify(exec);

export async function test(argv) {
  await cleanTestOutput();
  await testApp({ args: argv.params });
  await askShowTestOutput();
}

async function askShowTestOutput() {
  // Prompt user to view result
  const continueAnswer = await inquirer.prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Would you like to see the result? (View output/result.txt)',
  });
  if (continueAnswer.continue) {
    const { stdout } = await execAsync('cat output/result.txt');
    console.log(stdout.toString());
  }
}

async function cleanTestOutput() {
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR);
}

export async function testApp({ args = undefined }) {
  try {
    await checkDockerDaemon();
    const idappConfig = await readIDappConfig();
    const { withProtectedData } = idappConfig;

    // build a temp image for test
    const imageId = await dockerBuild({
      isForTest: true, // Adjust based on your logic
    });

    // run the temp image
    await runDockerContainer({
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
    });
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
