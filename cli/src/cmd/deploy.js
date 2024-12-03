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
import { askForAppSecret } from '../cli-helpers/askForAppSecret.js';
import { askForWalletPrivateKey } from '../cli-helpers/askForWalletPrivateKey.js';
import { Wallet } from 'ethers';
import { getIExecDebug } from '../utils/iexec.js';

export async function deploy() {
  const spinner = getSpinner();
  try {
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
    const appSecret = await askForAppSecret({ spinner });

    const walletAddress = await askForWalletAddress({ spinner });

    // if an app secret must be set we will need the app owner wallet to push it
    let iexec;
    if (appSecret !== null) {
      const privateKey = await askForWalletPrivateKey({ spinner });
      const wallet = new Wallet(privateKey);
      const address = await wallet.getAddress();
      if (address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw Error('Provided address and private key mismatch');
      }
      iexec = getIExecDebug(privateKey);
    }

    const config = await readPackageJonConfig();
    const iDappName = config.name.toLowerCase();

    const imageTag = `${dockerhubUsername}/${iDappName}:${idappVersion}`;

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
    spinner.succeed('TEE app deployed');
    if (appSecret !== null) {
      spinner.start('Attaching app secret to the deployed app');
      await iexec.app.pushAppSecret(appContractAddress, appSecret);
      spinner.succeed('App secret attached to the app');
    }
    spinner.succeed(
      `Deployment of your iDapp completed successfully:
  - image: ${sconifiedImage} (${dockerHubUrl})
  - app contract: ${appContractAddress}`
    );
  } catch (error) {
    handleCliError({ spinner, error });
  }
}
