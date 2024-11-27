import {
  dockerBuild,
  pushDockerImage,
  checkDockerDaemon,
} from '../execDocker/docker.js';
import { sconify } from '../utils/sconify.js';
import { askForDockerhubUsername } from '../cli-helpers/askForDockerhubUsername.js';
import { askForWalletAddress } from '../cli-helpers/askForWalletAddress.js';
import { readPackageJonConfig } from '../utils/idappConfigFile.js';
import { askForDockerhubAccessToken } from '../cli-helpers/askForDockerhubAccessToken.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';
import { getSpinner } from '../cli-helpers/spinner.js';

export async function deploy() {
  const spinner = getSpinner();

  const dockerhubUsername = await askForDockerhubUsername({ spinner });
  const dockerhubAccessToken = await askForDockerhubAccessToken({ spinner });

  const { idappVersion } = await spinner.prompt([
    {
      type: 'input',
      name: 'idappVersion',
      message: 'What is the version of your iDapp?',
      default: '0.1.0',
    },
  ]);

  const walletAddress = await askForWalletAddress({ spinner });

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
      'Transforming your image into a TEE image and deploying on iExec, this may take a few minutes...'
    );
    const { sconifiedImage, dockerHubUrl, appContractAddress } = await sconify({
      sconifyForProd: false,
      iDappNameToSconify: imageTag,
      walletAddress,
    });
    spinner.succeed(
      `Deployment of your iDapp completed successfully:
  - image: ${sconifiedImage} (${dockerHubUrl})
  - app contract: ${appContractAddress}`
    );
  } catch (error) {
    handleCliError({ spinner, error });
  }
}
