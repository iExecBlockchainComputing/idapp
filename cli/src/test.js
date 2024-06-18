import fs from 'fs';
import inquirer from 'inquirer';
import util from 'util';
import chalk from 'chalk';
import { exec } from 'child_process';
import ora from 'ora';
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
  try {
    spinner.text = 'Installing dependencies...';
    await execAsync('npm install');
    spinner.succeed('Dependencies installed.');
  } catch (e) {
    spinner.fail('Failed to install dependencies.');
    console.log(chalk.red('You need to install dotenv and figlet.'));
    return;
  }

  try {
    spinner.text = 'Running iDapp...';
    const { stdout, stderr } = await execAsync(
      `IEXEC_OUT=./output IEXEC_IN=./input node ./src/app.js ${arg}`
    );
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
  let dockerhubUsername = '';

  try {
    const idappConfigContent = fs.readFileSync('./idapp.config.json', 'utf8');
    const idappConfig = JSON.parse(idappConfigContent);
    dockerhubUsername = idappConfig.dockerhubUsername;
  } catch (err) {
    console.log('err', err);
    console.error(
      'Failed to read idapp.config.json file. Not critical, continue.'
    );
  }

  if (!dockerhubUsername) {
    const dockerHubUserNameAnswer = await inquirer.prompt({
      type: 'input',
      name: 'dockerHubUserName',
      message:
        'What is your username on Docker Hub? (It will be used to properly tag the Docker image)',
    });

    const dockerUsername = dockerHubUserNameAnswer.dockerHubUserName;
    if (!/[a-zA-Z0-9-]+/.test(dockerUsername)) {
      console.log(
        chalk.red(
          'Invalid Docker Hub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
        )
      );
      return;
    }

    dockerhubUsername = dockerUsername;
    const idappConfig = {
      dockerhubUsername,
    };
    fs.writeFileSync(
      './idapp.config.json',
      JSON.stringify(idappConfig, null, 2)
    );
  }

  const spinner = ora('Running your idapp ... \n').start();

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
    const { stdout, stderr } = await execAsync(
      `docker run --rm -v ./tmp/iexec_in:/iexec_in -v ./tmp/iexec_out:/iexec_out -e IEXEC_IN=/iexec_in -e IEXEC_OUT=/iexec_out ${dockerhubUsername}/${dockerImageName} ${arg}`
    );
    spinner.succeed('Docker container run successfully.');
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));

    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message:
        'Would you like to see the result? (`cat tmp/iexec_out/result.txt`)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat tmp/iexec_out/result.txt');
      console.log(stdout);
    }
  } catch (e) {
    spinner.fail('Failed to run Docker container.');
    console.log(chalk.red(`Failed to run Docker container: ${e.message}`));
  } finally {
    spinner.stop();
  }
}
