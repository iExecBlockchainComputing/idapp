import chalk from 'chalk';
import { readIDappConfig, writeIDappConfig } from '../utils/idappConfigFile.js';
import { CONFIG_FILE } from '../config/config.js';
import { isAddress } from 'ethers';

export async function askForWalletAddress({ spinner }) {
  const config = await readIDappConfig();
  const walletAddress = config.walletAddress || '';
  if (walletAddress) {
    spinner.log(`Using saved walletAddress (from "${CONFIG_FILE}")`);
    return walletAddress;
  }

  const { walletAddressAnswer } = await spinner.prompt({
    type: 'input',
    name: 'walletAddressAnswer',
    message:
      'What is your wallet address? (This wallet will be the owner of the iDapp)',
  });

  if (!isAddress(walletAddressAnswer)) {
    spinner.log(
      chalk.red(
        'Invalid wallet address. Ex: 0xC248cCe0a656a90F2Ae27ccfa8Bd11843c8e0f3c'
      )
    );
    return askForWalletAddress({ spinner });
  }

  // Save it into JSON config file
  config.walletAddress = walletAddressAnswer;
  await writeIDappConfig(config);
  spinner.log(`walletAddress saved to "${CONFIG_FILE}"`);

  return walletAddressAnswer;
}