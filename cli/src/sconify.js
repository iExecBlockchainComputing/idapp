import { request } from 'undici';
import inquirer from 'inquirer';
import ora from 'ora';

const SCONIFY_API_URL = 'http://idapp-poc.westeurope.cloudapp.azure.com:3000';

export async function sconify(argv) {
  const { dockerhubImageToSconify, yourWalletPublicAddress } =
    await inquirer.prompt([
      {
        type: 'input',
        name: 'dockerhubImageToSconify',
        message:
          'Which dockerhub image would you like to sconify? Ex: robiniexec/hello-world:1.0.0',
        default: 'robiniexec/hello-world:1.0.0',
      },
      {
        type: 'input',
        name: 'yourWalletPublicAddress',
        message:
          'What is your wallet public address? It will be used to transfer ownership of the app contract to you.',
        default: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
      },
    ]);

  if (!dockerhubImageToSconify || !yourWalletPublicAddress) {
    console.log(
      '/!\\ Please provide a dockerhub image and your wallet public address'
    );
    return;
  }

  const mainSpinner = ora('Sconifying your idapp ...').start();

  try {
    const { statusCode, body } = await request(`${SCONIFY_API_URL}/sconify`, {
      method: 'POST',
      body: JSON.stringify({
        dockerhubImageToSconify,
        yourWalletPublicAddress,
      }),
      throwOnError: true,
    });
    const json = await body.text();
    console.log('Result:', json);
  } catch (err) {
    console.log('\nerr', err.body);
    mainSpinner.fail('Failed to sconify your idapp');
    return;
  }

  mainSpinner.succeed('Done!');
}
