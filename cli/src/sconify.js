import fs from 'fs';
import chalk from 'chalk';
import { request } from 'undici';
import { ethers } from 'ethers';
import inquirer from 'inquirer';
import ora from 'ora';
import { readIDappConfig, readPackageJonConfig } from './utils/readConfig.js';

const SCONIFY_API_URL = 'http://idapp-poc.westeurope.cloudapp.azure.com:3000';

export async function sconify(argv) {
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
          if (ethers.utils.isAddress(input)) {
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
    console.log('\nResult:', json);
    teeDockerhubImagePath = json.sconifiedImage.split(':')[0];
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

  mainSpinner.succeed('Done!');

  console.log(
    `Have a look at your TEE-compatible Docker image on Docker Hub: https://hub.docker.com/r/${teeDockerhubImagePath}/tags`
  );
}
