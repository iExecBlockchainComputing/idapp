import ora from 'ora';
import util from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { sconify } from './sconify.js';
import { execDockerBuild } from './execDocker/build.js';
import { execDockerInfo } from './execDocker/info.js';
import { privateKeyManagement } from './utils/privateKeyManagement.js';
import {
  readIDappConfig,
  readPackageJonConfig,
  writeIDappConfig,
} from './utils/fs.js';

const execAsync = util.promisify(exec);

export async function deploy(argv) {
  let sconifyAnswer;
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
  // const mainSpinner = ora('Start deploying your idapp ...').start();

  const iDappName = readPackageJonConfig().name.toLowerCase();

  await execDockerInfo();
  try {
    const dockerLoginSpinner = ora('Docker login ...').start();
    await execAsync('docker login');
    dockerLoginSpinner.succeed('Docker login successful.');

    const dockerBuildSpinner = ora('Docker build ...').start();
    await execDockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName: iDappName,
    });
    dockerBuildSpinner.succeed('Docker image built.');

    const dockerTagSpinner = ora('Docker tag ...').start();
    await execAsync(
      `docker tag ${dockerhubUsername}/${iDappName} ${dockerhubUsername}/${iDappName}:${idappVersion}-debug`
    );
    dockerTagSpinner.succeed('Docker image tagged.');

    const dockerPushSpinner = ora('Docker push ...').start();
    await execAsync(
      `docker push ${dockerhubUsername}/${iDappName}:${idappVersion}-debug`
    );
    dockerPushSpinner.succeed('Docker image pushed.');
  } catch (e) {
    console.log(chalk.red(`An error occurred during the deployment of the non-tee image: ${e}`));
    return;
  }

  // Sconifying iDapp
  const sconifySpinner = ora(
    'Sconifying your idapp, this may take a few minutes ...'
  ).start();
  const { dockerHubUrl } = await sconify({
    mainSpinner: sconifySpinner,
    sconifyForProd: argv.prod || sconifyAnswer?.sconify === 'Prod',
    iDappNameToSconify: `${dockerhubUsername}/${iDappName}:${idappVersion}-debug`,
    wallet,
  });

  sconifySpinner.succeed(
    `Deployment of your idapp completed successfully: ${dockerHubUrl}`
  );
}
