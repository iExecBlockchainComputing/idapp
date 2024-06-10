import { exec } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import util from 'util';
import { execDockerInfo } from './execDocker/info.js';

/**
 * node src/testSconifiedImage.js
 *
 * This will:
 *  - Pull the sconified image from Docker Hub
 *  - Run the sconified image in a Docker container on your locally running Docker daemon
 *
 * For a "real" test, use iexec CLI:
 *  $> iexec app run <appContractAddress> --tag tee,scone --workerpool debug-v8-bellecour.main.pools.iexec.eth --watch
 *
 *  Example with app name: "robiniexec-hello-world"
 *  $> iexec app run 0xdf2c12596bf98c4f60db03B9b43d63f915c4849C --tag tee,scone --workerpool debug-v8-bellecour.main.pools.iexec.eth --watch
 */

const execAsync = util.promisify(exec);

async function testSconifiedImage() {
  const dockerhubImagePathAnswer = await inquirer.prompt({
    type: 'input',
    name: 'dockerhubImagePath',
    message:
      'Which sconified image would you like to test? (Please provide the full path to the image on Docker Hub)',
    // TODO FOR TESTS
    default: 'teamproduct/arthuryvars-web3telegram-app:latest-debug-tee-scone',
  });

  const dockerhubImagePath = dockerhubImagePathAnswer.dockerhubImagePath;
  if (!dockerhubImagePath) {
    console.log(
      chalk.red(
        'Invalid Docker Hub image path. Please provide the full path to the image on Docker Hub.'
      )
    );
    return;
  }

  const confirmSgxAnswer = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmSgx',
    message: "Do you have an SGX-compatible chip? Otherwise it won't work.",
  });
  if (confirmSgxAnswer.confirmSgx === false) {
    return;
  }

  let spinner = ora('Checking Docker daemon...').start();
  await execDockerInfo(spinner);

  spinner = ora('Pulling image from dockerhub ... \n').start();
  try {
    await execAsync(`docker pull ${dockerhubImagePath}`);
    spinner.succeed('Image pulled.');
  } catch (e) {
    spinner.fail('Failed to pull image from dockerhub.');
    console.error('docker pull ERROR', e);
  }

  spinner = ora('Running sconified idapp ... \n').start();
  try {
    spinner.text = 'Running Docker container...';
    const { stdout, stderr } = await execAsync(
      `docker run --rm -v ./tmp/iexec_in:/iexec_in -v ./tmp/iexec_out:/iexec_out -e IEXEC_IN=/iexec_in -e IEXEC_OUT=/iexec_out --platform linux/amd64 ${dockerhubImagePath}`
    );
    spinner.succeed('Docker container run successfully.');
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));
  } catch (e) {
    spinner.fail('Failed to run Docker container.');
    console.log(chalk.red(`Failed to run Docker container: ${e.message}`));
  } finally {
    spinner.stop();
  }
}

// FOR TESTS
testSconifiedImage();
