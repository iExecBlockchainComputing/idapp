import ora from 'ora';
import util from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { sconify } from './sconify.js';
import {
  dockerBuild,
  tagDockerImage,
  pushDockerImage,
} from './execDocker/docker.js';
import { execDockerInfo } from './execDocker/info.js';
import { privateKeyManagement } from './utils/privateKeyManagement.js';
import {
  readIDappConfig,
  readPackageJonConfig,
  writeIDappConfig,
} from './utils/fs.js';

const execAsync = util.promisify(exec);

export async function deploy(argv) {
  let mode;
  if (!argv.prod && !argv.debug) {
    const modeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Would you like to run your idapp for prod or debug?',
        choices: ['Debug', 'Prod'],
        default: 0, // Default to 'Debug'
      },
    ]);
    mode = modeAnswer.mode;
  }
  if (argv.debug || mode === 'Debug') {
    await deployInDebug(argv);
  } else {
    deployInProd(argv);
  }
}

export async function deployInDebug(argv) {
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
    const config = readIDappConfig();
    config.dockerhubUsername = dockerhubUsername;
    writeIDappConfig(config);
  }

  const { idappVersion } = await inquirer.prompt([
    {
      type: 'input',
      name: 'idappVersion',
      message: 'Please enter the version of your iDapp:',
      default: '0.1.0',
    },
  ]);

  // Get wallet from privateKey
  const wallet = await privateKeyManagement();

  const iDappName = readPackageJonConfig().name.toLowerCase();

  console.log('test before execDockerInfo');
  await execDockerInfo();

  try {
    console.log('test');
    const dockerBuildSpinner = ora('Docker build ...').start();
    await dockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName: iDappName,
    });
    dockerBuildSpinner.succeed('Docker image built.');

    const dockerTagSpinner = ora('Docker tag ...').start();
    await tagDockerImage(dockerhubUsername, iDappName, idappVersion);
    dockerTagSpinner.succeed('Docker image tagged.');

    await pushDockerImage(dockerhubUsername, iDappName, idappVersion);
  } catch (e) {
    console.log(
      chalk.red(
        `\n An error occurred during the deployment of the non-tee image: ${e.message}`
      )
    );
    return;
  }

  // Sconifying iDapp
  const sconifySpinner = ora(
    'Sconifying your idapp, this may take a few minutes ...'
  ).start();
  const { dockerHubUrl } = await sconify({
    mainSpinner: sconifySpinner,
    sconifyForProd: false,
    iDappNameToSconify: `${dockerhubUsername}/${iDappName}:${idappVersion}-debug`,
    wallet,
  });

  sconifySpinner.succeed(
    `Deployment of your idapp completed successfully: ${dockerHubUrl}`
  );
}

async function deployInProd(argv) {
  console.log(
    chalk.red('This feature is not yet implemented. Coming soon ...')
  );
}
