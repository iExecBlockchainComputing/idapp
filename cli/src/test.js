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
import { TEST_INPUT_DIR, TEST_OUTPUT_DIR } from './config/config.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  await cleanTestOutput();
  if (argv.docker) {
    await testWithDocker(argv.params);
  } else {
    await testWithoutDocker(argv.params);
  }
}

async function cleanTestOutput() {
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR);
}

async function testWithoutDocker(arg) {
  const spinner = ora('Reading iDapp JSON config file ...').start();

  const withProtectedData = readIDappConfig(spinner).withProtectedData;
  spinner.succeed('Reading idapp JSON config file.');

  try {
    spinner.start('Installing dependencies...');
    await execAsync('npm ci');
    spinner.succeed('Dependencies installed.');
  } catch (err) {
    spinner.fail('Failed to install dependencies.');
    console.error(err);
    process.exit(1);
  }

  try {
    spinner.start('Running iDapp...');
    let command = `cross-env IEXEC_OUT=${TEST_OUTPUT_DIR} IEXEC_IN=${TEST_INPUT_DIR} node ./src/app.js ${arg}`;
    if (withProtectedData) {
      command = `cross-env IEXEC_OUT=${TEST_OUTPUT_DIR} IEXEC_IN=${TEST_INPUT_DIR} IEXEC_DATASET_FILENAME="protectedData.zip" node ./src/app.js ${arg}`;
    }

    const { stdout, stderr } = await execAsync(command);
    spinner.succeed('Run completed.');
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));

    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Would you like to see the result? (`cat output/result.txt`)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat output/result.txt');
      console.log(stdout);
    }
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to run iDapp.');
    console.log(chalk.red('Failed to execute app.js file.'));
  }
}

export async function testWithDocker(arg) {
  try {
    const installDepSpinner = ora('Installing dependencies...').start();
    await execAsync('npm ci');
    installDepSpinner.succeed('Dependencies installed.');

    await checkDockerDaemon();

    const idappConfig = readIDappConfig();
    const { projectName, withProtectedData } = idappConfig;

    await dockerBuild({
      image: projectName,
      isForTest: true, // Adjust based on your logic
    });

    await runDockerContainer({
      image: projectName,
      cmd: [arg],
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
    });
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
