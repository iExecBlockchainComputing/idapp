import { request } from 'undici';
import { addDeploymentData } from './utils/cacheExecutions.js';
import { SCONIFY_API_URL } from './config/config.js';

export async function sconify({ iDappNameToSconify, walletAddress }) {
  let teeDockerhubImagePath = '';
  let sconifiedImage;
  let appContractAddress;
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
    sconifiedImage = json.sconifiedImage;
    appContractAddress = json.appContractAddress;

    // Add deployment data to deployments.json
    teeDockerhubImagePath = json.sconifiedImage.split(':')[0];
    await addDeploymentData({
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
    throw err;
  }

  return {
    sconifiedImage,
    dockerHubUrl: `https://hub.docker.com/r/${teeDockerhubImagePath}/tags`,
    appContractAddress,
  };
}
