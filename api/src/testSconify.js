import 'dotenv/config';
import { sconify } from './sconify.js';

/**
 * node src/testSconify.js
 */

function run() {
  return sconify({
    dockerImageToSconify:
      // 'https://hub.docker.com/repository/docker/robiniexec/hello-world/general',
      // 'hub.docker.com/robiniexec/hello-world',
      'robiniexec/hello-world:1.0.0',
    userWalletPublicAddress: '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD',
  });
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
