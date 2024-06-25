import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { request } from 'undici';
import { ethers } from 'ethers';
import inquirer from 'inquirer';
import { addDeploymentData } from './utils/cacheExecutions.js';
import { readIDappConfig, readPackageJonConfig } from './utils/fs.js';

const SCONIFY_API_URL = 'http://idapp-poc.westeurope.cloudapp.azure.com:3000';

export async function sconify(argv) {
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

  const packageConfig = readPackageJonConfig();
  const iDappName = packageConfig.name
    ? packageConfig.name.toLowerCase()
    : null;
  const idappConfig = await readIDappConfig();
  const dockerhubUsername = idappConfig.dockerhubUsername;
  let walletAddress = idappConfig.walletAddress;

  if (!dockerhubUsername) {
    console.log(
      chalk.red(
        'You may not have published your non-tee docker image before doing this command.'
      )
    );
    return;
  }

  const { imageToSconify } = await inquirer.prompt([
    {
      type: 'input',
      name: 'imageToSconify',
      message:
        'Which dockerhub image would you like to sconify? Ex: hello-world:1.0.0',
      default: `${iDappName || 'my-idapp'}:0.1.0-debug`,
    },
  ]);

  const dockerhubImageToSconify = `${dockerhubUsername}/${imageToSconify}`;

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    const { yourWalletPublicAddress } = await inquirer.prompt([
      {
        type: 'input',
        name: 'yourWalletPublicAddress',
        message:
          'What is your wallet public address? It will be used to transfer ownership of the app contract to you.',
        default: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
        validate: (input) => {
          if (ethers.isAddress(input)) {
            return true;
          }
          return 'Please enter a valid Ethereum address.';
        },
      },
    ]);

    walletAddress = yourWalletPublicAddress;

    // Update the configuration with the new wallet address
    idappConfig.walletAddress = walletAddress;
    fs.writeFileSync(
      './idapp.config.json',
      JSON.stringify(idappConfig, null, 2)
    );
    console.log(
      chalk.green(
        'Wallet address updated successfully in the configuration file.'
      )
    );
  } else if (!ethers.isAddress(walletAddress)) {
    console.log(
      chalk.red('The existing wallet address in the configuration is invalid.')
    );
    return;
  }

  if (!dockerhubImageToSconify || !walletAddress) {
    console.log(
      '/!\\ Please provide a dockerhub image and your wallet public address'
    );
    return;
  }

  const mainSpinner = ora('Sconifying your idapp ...').start();
  setTimeout(() => {
    mainSpinner.text = 'This may take a few minutes ...';
  }, 1500);

  let teeDockerhubImagePath = '';
  if (argv.debug || sconifyAnswer?.sconify === 'Debug') {
    try {
      const { body } = await request(`${SCONIFY_API_URL}/sconify`, {
        method: 'POST',
        body: JSON.stringify({
          dockerhubImageToSconify,
          yourWalletPublicAddress: walletAddress,
        }),
        throwOnError: true,
      });
      const json = await body.json();
      // Extract necessary information
      const sconifiedImage = json.sconifiedImage;
      const appContractAddress = json.appContractAddress;
      const transferAppTxHash = json.transferAppTxHash;

      // Display the result in a beautiful format
      mainSpinner.succeed('iDapp Sconified successfully');
      console.log(` Sconified Image: ${sconifiedImage}`);

      mainSpinner.succeed('iDapp deployed');
      console.log(` iDapp Address: ${appContractAddress}`);
      console.log(` Transfer App Transaction Hash: ${transferAppTxHash}`);

      mainSpinner.succeed('iDapp Transfer to you');

      // Add deployment data to deployments.json
      teeDockerhubImagePath = json.sconifiedImage.split(':')[0];
      addDeploymentData({
        sconifiedImage,
        appContractAddress,
        transferAppTxHash,
      });
    } catch (err) {
      if (err.body) {
        console.log('\nerr', err.body);
      } else {
        if (
          err?.code === 'ECONNREFUSED' ||
          err?.code === 'UND_ERR_CONNECT_TIMEOUT'
        ) {
          console.error('\n⚠️ Sconification server seems to be down!');
        } else {
          console.log('\nerr', err);
        }
      }
      mainSpinner.fail('Failed to sconify your idapp');
      return;
    }
  }

  if (argv.prod || sconifyAnswer?.sconify === 'Prod') {
    try {
      console.log(
        chalk.red('This feature is not yet implemented. Coming soon ...')
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

  mainSpinner.succeed('Done!');
  console.log(
    `Have a look at your TEE-compatible Docker image on Docker Hub: https://hub.docker.com/r/${teeDockerhubImagePath}/tags`
  );
}
