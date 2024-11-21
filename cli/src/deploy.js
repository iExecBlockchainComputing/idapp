import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { sconify } from './sconify.js';
import {
  dockerBuild,
  pushDockerImage,
  checkDockerDaemon,
} from './execDocker/docker.js';
import { askForDockerhubUsername } from './utils/askForDockerhubUsername.js';
import { askForWalletAddress } from './utils/askForWalletAddress.js';
import { readPackageJonConfig } from './utils/idappConfigFile.js';
import { askForDockerhubAccessToken } from './utils/askForDockerhubAccessToken.js';

export async function deploy(argv) {
  let mode;
  if (!argv.prod && !argv.debug) {
    const modeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Would you like to build your iDapp for prod or debug?',
        choices: ['Debug', 'Prod (soon)'],
        default: 0, // Default to 'Debug'
      },
    ]);
    mode = modeAnswer.mode;
  }
  if (argv.debug || mode === 'Debug') {
    await deployForDebug();
  } else {
    deployForProd();
  }
  process.exit(0);
}

export async function deployForDebug() {
  const dockerhubUsername = await askForDockerhubUsername();
  const dockerhubAccessToken = await askForDockerhubAccessToken();

  const { idappVersion } = await inquirer.prompt([
    {
      type: 'input',
      name: 'idappVersion',
      message: 'What is the version of your iDapp?',
      default: '0.1.0',
    },
  ]);

  // Get wallet from privateKey
  // TODO We need to find a workaround and stop asking the user their password (sensitive info!)
  const walletAddress = await askForWalletAddress();

  const config = await readPackageJonConfig();
  const iDappName = config.name.toLowerCase();

  const imageTag = `${dockerhubUsername}/${iDappName}:${idappVersion}`;

  await checkDockerDaemon();

  try {
    await dockerBuild({
      tag: imageTag,
    });
    await pushDockerImage({
      tag: imageTag,
      dockerhubAccessToken,
      dockerhubUsername,
    });
  } catch (e) {
    console.log(
      chalk.red(
        `\n An error occurred during the deployment of the non-tee image: ${e.message}`
      )
    );
    return;
  }

  try {
    // Sconifying iDapp
    const sconifySpinner = ora(
      'Sconifying your iDapp, this may take a few minutes ...'
    ).start();
    const { dockerHubUrl } = await sconify({
      mainSpinner: sconifySpinner,
      sconifyForProd: false,
      iDappNameToSconify: imageTag,
      walletAddress,
    });

    sconifySpinner.succeed(
      `Deployment of your iDapp completed successfully: ${dockerHubUrl}`
    );
  } catch (e) {
    process.exit(1);
  }
}

function deployForProd() {
  console.log(
    chalk.red('This feature is not yet implemented. Coming soon ...')
  );
}
