import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import util from 'util';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from './execDocker/docker.js';
import { promptForDockerHubUsername } from './execDocker/prompt.js';
import { readIDappConfig } from './utils/fs.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  if (argv.docker) {
    await testWithDocker(argv.params);
  } else {
    await testWithoutDocker(argv.params);
  }
}

async function testWithoutDocker(arg) {
  const spinner = ora('Running your idapp ... \n').start();

  let withProtectedData;
  try {
    withProtectedData = readIDappConfig().withProtectedData;
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to read idapp.config.json file.');
  }
  try {
    spinner.text = 'Installing dependencies...';
    await execAsync('npm ci');
    spinner.succeed('Dependencies installed.');
  } catch (e) {
    spinner.fail('Failed to install dependencies.');
    console.log(chalk.red('You need to install dotenv and figlet.'));
    return;
  }

  try {
    spinner.text = 'Running iDapp...';
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
  let idappConfig;
  let dockerhubUsername;

  try {
    idappConfig = await readIDappConfig();
    dockerhubUsername = idappConfig.dockerhubUsername || '';

    const dockerHubUserNameAnswer =
      await promptForDockerHubUsername(dockerhubUsername);
    if (!dockerHubUserNameAnswer) {
      return;
    }

    dockerhubUsername = dockerHubUserNameAnswer;
    idappConfig.dockerhubUsername = dockerHubUserNameAnswer;
    fs.writeFileSync(
      './idapp.config.json',
      JSON.stringify(idappConfig, null, 2)
    );

    const installDepSpinner = ora('Installing dependencies...').start();
    await execAsync('npm ci'); // Assuming this installs necessary dependencies
    installDepSpinner.succeed('Dependencies installed.');

    await checkDockerDaemon();

    const dockerImageName = 'hello-world';
    await dockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName,
      isForTest: idappConfig.withProtectedData || false, // Adjust based on your logic
    });

    const containerConfig = {
      dockerhubUsername,
      imageName: dockerImageName,
      arg,
      withProtectedData: idappConfig.withProtectedData,
    };
    await runDockerContainer(containerConfig);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
