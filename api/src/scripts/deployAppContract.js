import 'dotenv/config';
import { deployAppContractToBellecour } from '../singleFunction/deployAppContractToBellecour.js';

/**
 * node src/scripts/deployAppContract.js
 */

function run() {
  return deployAppContractToBellecour({
    userWalletPublicAddress: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
    appName: 'toto',
    dockerImagePath:
      'teamproduct/arthuryvars-web3telegram-app:latest-debug-tee-scone',
    dockerImageDigest:
      '2a4c3a871d138ae3b292270997435ebf8f6a4bb7fd4bc85d9db9cbe3d69d23fe',
  });
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
