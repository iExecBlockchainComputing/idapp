import 'dotenv/config';
import { sconify } from '../sconify/sconify.js';

/**
 * node src/scripts/testSconify.js
 */

function run() {
  return sconify({
    // dockerImageToSconify: 'cedric25/my-idapp2:0.1.0-debug',
    dockerImageToSconify: 'arthuryvars/web3telegram-app',

    // cedric's Metamask account 1
    // app contract will be transferred to this address at the end
    userWalletPublicAddress: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
  });
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
