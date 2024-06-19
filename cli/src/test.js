import fs from 'fs';
import inquirer from 'inquirer';
import util from 'util';
import chalk from 'chalk';
import { exec } from 'child_process';
import ora from 'ora';
import { readIDappConfig } from './utils/fs.js';
import { execDockerBuild } from './execDocker/build.js';
import { execDockerInfo } from './execDocker/info.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  if (argv.docker) {
    await testWithDocker(argv.params);
  } else {
    await testWithoutDocker(argv.params);
  }
}

async function testWithoutDocker(arg) {
  const spinner = ora('Running your idapp ... \n').start();

  let withProtectedData;
  try {
    withProtectedData = readIDappConfig().withProtectedData;
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to read idapp.config.json file.');
  }
  try {
    spinner.text = 'Installing dependencies...';
    await execAsync('npm ci');
    spinner.succeed('Dependencies installed.');
  } catch (e) {
    spinner.fail('Failed to install dependencies.');
    console.log(chalk.red('You need to install dotenv and figlet.'));
    return;
  }

  try {
    spinner.text = 'Running iDapp...';
    let command = `IEXEC_OUT=./output IEXEC_IN=./input node ./src/app.js ${arg}`;
    if (withProtectedData) {
      command = `IEXEC_OUT=./output IEXEC_IN=./input IEXEC_DATASET_FILENAME="protectedData.zip" node ./src/app.js ${arg}`;
    }

    const { stdout, stderr } = await execAsync(command);
    spinner.succeed('Run completed.');
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));

    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Would you like to see the result? (`cat output/result.txt`)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat output/result.txt');
      console.log(stdout);
    }
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to run iDapp.');
    console.log(chalk.red('Failed to execute app.js file.'));
  }
}

async function testWithDocker(arg) {
  let idappConfig = await readIDappConfig();
  let dockerhubUsername = idappConfig.dockerhubUsername || '';

  if (!dockerhubUsername) {
    const { dockerHubUserNameAnswer } = await inquirer.prompt({
      type: 'input',
      name: 'dockerHubUserNameAnswer',
      message:
        'What is your username on Docker Hub? (It will be used to properly tag the Docker image)',
    });

    if (!/^[a-zA-Z0-9-]+$/.test(dockerHubUserNameAnswer)) {
      console.log(
        chalk.red(
          'Invalid Docker Hub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
        )
      );
      return;
    }

    dockerhubUsername = dockerHubUserNameAnswer;
    idappConfig.dockerhubUsername = dockerHubUserNameAnswer;
    fs.writeFileSync(
      './idapp.config.json',
      JSON.stringify(idappConfig, null, 2)
    );
  }

  const spinner = ora('Running your idapp ... \n').start();
  let withProtectedData;
  try {
    withProtectedData = readIDappConfig().withProtectedData;
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to read idapp.config.json file.');
  }
  try {
    spinner.text = 'Installing dependencies...';
    await execAsync('npm ci'); // be careful dependency should be installed for node14
    spinner.succeed('Dependencies installed.');
  } catch (e) {
    spinner.fail('Failed to install dependencies.');
    console.log(chalk.red('You need to install dotenv and figlet.'));
    return;
  }

  spinner.text = 'Checking Docker daemon...';
  await execDockerInfo(spinner);

  const dockerImageName = 'hello-world';
  try {
    spinner.text = 'Building Docker image...';
    await execDockerBuild({
      dockerHubUser: dockerhubUsername,
      dockerImageName,
      isForTest: true,
    });
    spinner.succeed('Docker image built.');
  } catch (e) {
    spinner.fail('Failed to build Docker image.');
    console.log(chalk.red(`Failed to build Docker image: ${e.message}`));
    return;
  }

  try {
    spinner.text = 'Running Docker container...';
    let command = `docker run --rm -v ./input:/iexec_in -v ./output:/iexec_out -e IEXEC_IN=/iexec_in -e IEXEC_OUT=/iexec_out ${dockerhubUsername}/${dockerImageName} ${arg}`;
    if (withProtectedData) {
      command = `docker run --rm -v ./input:/iexec_in -v ./output:/iexec_out -e IEXEC_IN=/iexec_in -e IEXEC_OUT=/iexec_out -e IEXEC_DATASET_FILENAME="protectedData.zip" ${dockerhubUsername}/${dockerImageName} ${arg}`;
    }

    const { stdout, stderr } = await execAsync(command);
    spinner.succeed('Docker container run successfully.');
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));

    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message:
        'Would you like to see the result? (`cat tmp/iexec_out/result.txt`)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat output/result.txt');
      console.log(stdout);
    }
  } catch (e) {
    spinner.fail('Failed to run Docker container.');
    console.log(chalk.red(`Failed to run Docker container: ${e.message}`));
  } finally {
    spinner.stop();
  }
}
