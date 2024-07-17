import chalk from 'chalk';
import { exec } from 'child_process';
import inquirer from 'inquirer';
import ora from 'ora';
import util from 'util';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from './execDocker/docker.js';
import { askForDockerhubUsername } from './utils/askForDockerhubUsername.js';
import { readIDappConfig } from './utils/idappConfigFile.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  if (argv.docker) {
    await testWithDocker(argv.params);
  } else {
    await testWithoutDocker(argv.params);
  }
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
    let command = `cross-env IEXEC_OUT=./output IEXEC_IN=./input node ./src/app.js ${arg}`;
    if (withProtectedData) {
      command = `cross-env IEXEC_OUT=./output IEXEC_IN=./input IEXEC_DATASET_FILENAME="protectedData.zip" node ./src/app.js ${arg}`;
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
    const dockerhubUsername = await askForDockerhubUsername();

    const installDepSpinner = ora('Installing dependencies...').start();
    await execAsync('npm ci');
    installDepSpinner.succeed('Dependencies installed.');

    await checkDockerDaemon();

    const idappConfig = readIDappConfig();
    const projectName = idappConfig.projectName;

    await dockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName: projectName,
      isForTest: true, // Adjust based on your logic
    });

    const containerConfig = {
      dockerhubUsername,
      imageName: projectName,
      arg,
      withProtectedData: idappConfig.withProtectedData,
    };
    await runDockerContainer(containerConfig);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
