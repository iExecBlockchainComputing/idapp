import 'dotenv/config';
import { sconify } from './sconify.js';

/**
 * node src/testSconify.js
 */

function run() {
  return sconify({
    // dockerImageToSconify: 'cedric25/my-idapp2:0.1.0-debug',
    dockerImageToSconify: 'arthuryvars/web3telegram-app',

    // cedric Metamask account 1
    userWalletPublicAddress: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
  });
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
