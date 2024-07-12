import chalk from 'chalk';
import inquirer from 'inquirer';
import { readIDappConfig, writeIDappConfig } from './idappConfigFile.js';

export async function askForWalletPrivateKey() {
  const walletPrivateKey = readIDappConfig().walletPrivateKey || '';
  if (walletPrivateKey) {
    console.log('Using saved walletPrivateKey (from "idapp.config.json")');
    return walletPrivateKey;
  }

  const { walletPrivateKeyAnswer } = await inquirer.prompt({
    type: 'password',
    name: 'walletPrivateKeyAnswer',
    message:
      'What is your wallet private key? (It will be used to assert that you are the owner of the app.)',
    mask: '*',
  });

  const { savePrivateKeyAnswer } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'savePrivateKeyAnswer',
      message: 'Do you want to save this private key to your config?',
      default: false,
    },
  ]);

  if (!savePrivateKeyAnswer) {
    return walletPrivateKeyAnswer;
  }

  const config = readIDappConfig();
  config.walletPrivateKey = walletPrivateKeyAnswer;
  writeIDappConfig(config);
  console.log('walletPrivateKey saved to "idapp.config.json"');

  return walletPrivateKeyAnswer;
}
