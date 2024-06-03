import 'dotenv/config';
import { sconify } from './sconify.js';

/**
 * node src/testSconify.js
 */

function run() {
  return sconify({});
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
