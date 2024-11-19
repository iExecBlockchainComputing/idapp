import inquirer from 'inquirer';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { readIDappConfig, writeIDappConfig } from './idappConfigFile.js';

export async function privateKeyManagement() {
  let config;
  let userWalletPrivateKey;

  try {
    config = await readIDappConfig();
    userWalletPrivateKey = config.account;
  } catch (err) {
    console.log('err', err);
    return;
  }

  if (!userWalletPrivateKey) {
    const { privateKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'privateKey',
        message: 'Please enter your private key:',
        mask: '*',
      },
    ]);

    userWalletPrivateKey = privateKey;

    const { saveKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveKey',
        message: 'Do you want to save this private key to your config?',
        default: false,
      },
    ]);

    if (saveKey) {
      config.account = userWalletPrivateKey;
      try {
        await writeIDappConfig(config);
        console.log(chalk.green('Private key saved to config.'));
      } catch (err) {
        console.log(chalk.red('Failed to save private key to config.'));
        console.log('err', err);
      }
    }
  }
  const wallet = new ethers.Wallet(userWalletPrivateKey);
  return wallet;
}
