import chalk from 'chalk';
import inquirer from 'inquirer';
import { readIDappConfig, writeIDappConfig } from './idappConfigFile.js';

export async function askForWalletAddress() {
  const walletAddress = readIDappConfig().walletAddress || '';
  if (walletAddress) {
    console.log('Using saved walletAddress (from "idapp.config.json")');
    return walletAddress;
  }

  const { walletAddressAnswer } = await inquirer.prompt({
    type: 'input',
    name: 'walletAddressAnswer',
    message:
      'What is your wallet address? (This wallet will be the owner of the iDapp)',
  });

  // TODO Use ethers.isAddress?
  if (!/0x[a-fA-F0-9]{40}/.test(walletAddressAnswer)) {
    console.log(
      chalk.red(
        'Invalid wallet address. Ex: 0xC248cCe0a656a90F2Ae27ccfa8Bd11843c8e0f3c'
      )
    );
    return askForWalletAddress();
  }

  // Save it into JSON config file
  const config = readIDappConfig();
  config.walletAddress = walletAddressAnswer;
  writeIDappConfig(config);
  console.log('walletAddress saved to "idapp.config.json"');

  return walletAddressAnswer;
}
