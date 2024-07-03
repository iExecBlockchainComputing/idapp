import util from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

const execAsync = util.promisify(exec);

export async function execDockerInfo(spinner) {
  try {
    await execAsync('docker info');
    console.log('every things looks good');
    // spinner.succeed('Docker daemon is running.');
  } catch (e) {
    // spinner.fail('Docker daemon is not running.');
    console.log(
      chalk.red('Your Docker daemon is not up... Start your Docker daemon')
    );
    throw e;
  }
}
