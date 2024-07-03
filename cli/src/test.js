import fs from 'fs';
import inquirer from 'inquirer';
import util from 'util';
import chalk from 'chalk';
import { exec } from 'child_process';
import ora from 'ora';
import { readIDappConfig } from './utils/fs.js';
import {
  dockerBuild,
  checkDockerDaemon,
  runDockerContainer,
} from './execDocker/docker.js';

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
    let command = `IEXEC_OUT=./output IEXEC_IN=./input node ./src/app.js ${arg}`;
    if (withProtectedData) {
      command = `IEXEC_OUT=./output IEXEC_IN=./input IEXEC_DATASET_FILENAME="protectedData.zip" node ./src/app.js ${arg}`;
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

  const spinner = ora('Setting up...').start();

  try {
    idappConfig = await readIDappConfig();
    dockerhubUsername = idappConfig.dockerhubUsername || '';

    if (!dockerhubUsername) {
      const { dockerHubUserNameAnswer } = await inquirer.prompt({
        type: 'input',
        name: 'dockerHubUserNameAnswer',
        message:
          'What is your username on Docker Hub? (It will be used to properly tag the Docker image)',
      });

      if (!/^[a-zA-Z0-9-]+$/.test(dockerHubUserNameAnswer)) {
        spinner.fail(
          'Invalid Docker Hub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
        );
        return;
      }

      dockerhubUsername = dockerHubUserNameAnswer;
      idappConfig.dockerhubUsername = dockerHubUserNameAnswer;
      fs.writeFileSync(
        './idapp.config.json',
        JSON.stringify(idappConfig, null, 2)
      );
    }

    spinner.text = 'Installing dependencies...';
    await execAsync('npm ci'); // Assuming this installs necessary dependencies
    spinner.succeed('Dependencies installed.');

    spinner.text = 'Checking Docker daemon...';
    await checkDockerDaemon(spinner);

    spinner.text = 'Building Docker image...';
    const dockerImageName = 'hello-world';
    await dockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName,
      isForTest: idappConfig.withProtectedData || false, // Adjust based on your logic
    });

    spinner.text = 'Running Docker container...';
    const containerConfig = {
      dockerhubUsername,
      imageName: dockerImageName,
      arg,
      withProtectedData: idappConfig.withProtectedData,
    };
    await runDockerContainer(containerConfig, spinner);
  } catch (error) {
    spinner.fail('Failed to run Docker container.');
    console.error(chalk.red(`Error: ${error.message}`));
  } finally {
    spinner.stop();
  }
}
