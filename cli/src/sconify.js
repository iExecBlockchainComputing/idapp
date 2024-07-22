import chalk from 'chalk';
import { request } from 'undici';
import { addDeploymentData } from './utils/cacheExecutions.js';
import { SCONIFY_API_URL } from './config/config.js';

export async function sconify({
  mainSpinner,
  sconifyForProd,
  iDappNameToSconify,
  walletAddress,
}) {
  if (sconifyForProd) {
    console.log(
      chalk.red('This feature is not yet implemented. Coming soon ...')
    );
    process.exit(0);
  }

  let teeDockerhubImagePath = '';
  try {
    const { body } = await request(`${SCONIFY_API_URL}/sconify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dockerhubImageToSconify: iDappNameToSconify,
        yourWalletPublicAddress: walletAddress,
      }),
      throwOnError: true,
    });
    const json = await body.json();

    // Extract necessary information
    const sconifiedImage = json.sconifiedImage;
    const appContractAddress = json.appContractAddress;

    // Display the result in a beautiful format
    mainSpinner.succeed('iDapp sconified successfully.');
    console.log(` Sconified image: ${sconifiedImage}`);

    mainSpinner.succeed('iDapp deployed');
    console.log(` iDapp address: ${appContractAddress}`);

    mainSpinner.succeed('iDapp transferred to you');

    // Add deployment data to deployments.json
    teeDockerhubImagePath = json.sconifiedImage.split(':')[0];
    addDeploymentData({
      sconifiedImage,
      appContractAddress,
      owner: walletAddress,
    });
  } catch (err) {
    console.log('err', JSON.stringify(err, null, 2));
    if (err.body) {
      console.log('\nerr', err.body);
    } else {
      if (
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'UND_ERR_CONNECT_TIMEOUT'
      ) {
        console.error("\n⚠️ Can't reach sconification server!");
      } else {
        console.log('\nerr', err);
      }
    }
    mainSpinner.fail('Failed to sconify your iDapp');
    throw err;
  }

  return {
    dockerHubUrl: `https://hub.docker.com/r/${teeDockerhubImagePath}/tags`,
  };
}
