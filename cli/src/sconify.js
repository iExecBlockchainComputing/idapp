import chalk from 'chalk';
import { request } from 'undici';
import { addDeploymentData } from './utils/cacheExecutions.js';
import { SCONIFY_API_URL } from './config/config.js';

export async function sconify({
  mainSpinner,
  sconifyForProd,
  iDappNameToSconify,
  wallet,
}) {
  let teeDockerhubImagePath = '';
  if (!sconifyForProd) {
    try {
      const { body } = await request(`${SCONIFY_API_URL}/sconify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dockerhubImageToSconify: iDappNameToSconify,
          yourWalletPublicAddress: wallet.address,
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

  if (sconifyForProd) {
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

  return {
    dockerHubUrl: `https://hub.docker.com/r/${teeDockerhubImagePath}/tags`,
  };
}
