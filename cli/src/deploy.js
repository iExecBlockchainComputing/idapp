import ora from 'ora';
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
import { handleCliError } from './utils/cli-helpers.js';

export async function deploy() {
  const spinner = ora();

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

  try {
    // just start the spinner, no need to persist success in terminal
    spinner.start('Checking docker daemon is running...');
    await checkDockerDaemon();

    spinner.start('Building docker image...\n');
    const buildLogs = [];
    const imageId = await dockerBuild({
      tag: imageTag,
      progressCallback: (msg) => {
        buildLogs.push(msg); // do we want to show build logs after build is successful?
        spinner.text = spinner.text + msg;
      },
    });
    spinner.succeed(`Docker image built (${imageId}) and tagged ${imageTag}`);

    spinner.start('Pushing docker image...\n');
    await pushDockerImage({
      tag: imageTag,
      dockerhubAccessToken,
      dockerhubUsername,
      progressCallback: (msg) => {
        spinner.text = spinner.text + msg;
      },
    });
    spinner.succeed(`Pushed image ${imageTag} on dockerhub`);

    spinner.start(
      'Transforming your image into a TEE image and deploying on iExec, this may take a few minutes ...'
    );
    const { dockerHubUrl } = await sconify({
      mainSpinner: sconifySpinner,
      sconifyForProd: false,
      iDappNameToSconify: imageTag,
      walletAddress,
    });
    spinner.succeed(
      `Deployment of your iDapp completed successfully: ${dockerHubUrl}`
    );
  } catch (error) {
    handleCliError({ spinner, error });
  }
}
