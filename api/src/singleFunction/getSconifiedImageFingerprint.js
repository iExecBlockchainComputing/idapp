import { exec } from 'child_process';
import util from 'util';

/**
 * node src/singleFunction/getSconifiedImageFingerprint.js
 */

const execAsync = util.promisify(exec);

export async function getSconifiedImageFingerprint({ targetImagePath }) {
  const data = await execAsync(
    `docker run --rm -e SCONE_HASH=1 ${targetImagePath}`
  );
  console.log('data', data);
  if (!data.stdout) {
    throw new Error('No fingerprint found');
  }
  return data.stdout;
}

// FOR TESTS
// getSconifiedImageFingerprint({
//   targetImagePath:
//     'teamproduct/arthuryvars-web3telegram-app:latest-debug-tee-scone',
// }).then((res) => console.log('res', res));
