import { readIDappConfig, writeIDappConfig } from '../utils/idappConfigFile.js';
import { CONFIG_FILE } from '../config/config.js';

export async function askForWalletPrivateKey({ spinner }) {
  const config = await readIDappConfig();

  const walletPrivateKey = config.walletPrivateKey || '';
  if (walletPrivateKey) {
    spinner.log(`Using saved walletPrivateKey (from "${CONFIG_FILE}")`);
    return walletPrivateKey;
  }

  const { walletPrivateKeyAnswer } = await spinner.prompt({
    type: 'password',
    name: 'walletPrivateKeyAnswer',
    message:
      'What is your wallet private key? (It will be used to assert that you are the owner of the app.)',
    mask: '*',
  });

  const { savePrivateKeyAnswer } = await spinner.prompt([
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

  config.walletPrivateKey = walletPrivateKeyAnswer;
  await writeIDappConfig(config);
  spinner.log(`walletPrivateKey saved to "${CONFIG_FILE}"`);

  return walletPrivateKeyAnswer;
}
