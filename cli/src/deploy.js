import ora from 'ora';
import util from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { execDockerBuild } from './execDocker/build.js';
import { execDockerInfo } from './execDocker/info.js';
import { readIDappConfig, readPackageJonConfig } from './utils/readConfig.js';

const execAsync = util.promisify(exec);

export async function deploy(argv) {
  let sconifyAnswer;
  let idappVersion;

  if (!argv.prod && !argv.debug) {
    sconifyAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'sconify',
        message: 'Would you like to deploy your idapp for prod or debug?',
        choices: ['Debug', 'Prod'],
        default: 0, // Default to 'Debug'
      },
    ]);
  }

  let dockerhubUsername = readIDappConfig().dockerhubUsername || '';
  if (!dockerhubUsername) {
    const { dockerHubUserNameAnswer } = await inquirer.prompt({
      type: 'input',
      name: 'dockerHubUserNameAnswer',
      message: 'What is your username on Docker Hub?',
    });

    if (!/[a-zA-Z0-9-]+/.test(dockerHubUserNameAnswer)) {
      console.log(
        chalk.red(
          'Invalid Docker Hub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
        )
      );
      return;
    }
    dockerhubUsername = dockerHubUserNameAnswer;
  }

  const versionAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Please enter the version of your iDapp:',
      default: '0.1.0',
    },
  ]);
  idappVersion = versionAnswer.version;

  const mainSpinner = ora('Start deploying your idapp ...').start();

  const iDappName = readPackageJonConfig().name.toLowerCase();

  let stepSpinner = ora('Checking Docker daemon...').start();
  await execDockerInfo(stepSpinner);

  try {
    stepSpinner = ora('Logging in to Docker...').start();
    await execAsync('docker login');
    stepSpinner.succeed('Docker login successful.');
  } catch (e) {
    stepSpinner.fail('Docker login failed.');
    console.log(chalk.red(e));
    mainSpinner.fail('Failed to deploy your idapp.');
    return;
  }

  let dockerImagePath = '';
  if (argv.debug || sconifyAnswer?.sconify === 'Debug') {
    try {
      stepSpinner = ora('Building Docker image...').start();
      await execDockerBuild({
        dockerHubUser: dockerhubUsername,
        dockerImageName: iDappName,
      });
      stepSpinner.succeed('Docker image built.');

      stepSpinner = ora('Tagging Docker image...').start();
      await execAsync(
        `docker tag ${dockerhubUsername}/${iDappName} ${dockerhubUsername}/${iDappName}:${idappVersion}-debug`
      );
      stepSpinner.succeed('Docker image tagged.');

      stepSpinner = ora('Pushing Docker image...').start();
      await execAsync(
        `docker push ${dockerhubUsername}/${iDappName}:${idappVersion}-debug`
      );
      dockerImagePath = `${dockerhubUsername}/${iDappName}:${idappVersion}-debug`;
      stepSpinner.succeed('Docker image pushed.');

      // TODO Call sconification API right here?
      // Other CLI command for now
    } catch (e) {
      stepSpinner.fail(
        'An error occurred during the debug deployment process.'
      );
      console.log(chalk.red(e));
      mainSpinner.fail('Failed to deploy your idapp.');
      return;
    }
  }

  if (argv.prod || sconifyAnswer?.sconify === 'Prod') {
    try {
      console.log(
        chalk.red('This feature is not yet implemented. Coming soon')
      );
    } catch (e) {
      stepSpinner.fail(
        'An error occurred during the production deployment process.'
      );
      console.log(chalk.red(e));
      mainSpinner.fail('Failed to deploy your idapp.');
      return;
    }
  }

  const dockerHubUrl = `https://hub.docker.com/repository/docker/${dockerhubUsername}/${iDappName}`;
  mainSpinner.succeed(
    `Deployment of your idapp completed successfully: ${dockerHubUrl}`
  );
}
