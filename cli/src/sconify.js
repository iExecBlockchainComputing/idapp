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
        default: 'cedric25/my-idapp:0.1.0-debug',
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
  setTimeout(() => {
    mainSpinner.text = 'This may take a few minutes ...';
  }, 1500);

  try {
    const { body } = await request(`${SCONIFY_API_URL}/sconify`, {
      method: 'POST',
      body: JSON.stringify({
        dockerhubImageToSconify,
        yourWalletPublicAddress,
      }),
      throwOnError: true,
    });
    const json = await body.json();
    console.log('\nResult:', json);
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

  const dockerhubImagePath = json.sconifiedDockerImage.split(':')[0];

  console.log(
    `Have a look at your TEE-compatible Docker image on Docker Hub: https://hub.docker.com/r/${dockerhubImagePath}/tags`
  );
}
