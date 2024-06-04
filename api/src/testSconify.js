import 'dotenv/config';
import { sconify } from './sconify.js';

/**
 * node src/testSconify.js
 */

function run() {
  return sconify({
    dockerImageToSconify:
      'https://hub.docker.com/repository/docker/robiniexec/hello-world/general',
  });
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
