import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import util from 'util';
import {
  checkDockerDaemon,
  dockerBuild,
  runDockerContainer,
} from './execDocker/docker.js';
import { promptForDockerHubUsername } from './execDocker/prompt.js';
import { readIDappConfig } from './utils/fs.js';

const execAsync = util.promisify(exec);

export async function test(argv) {
  if (argv.docker) {
    await testWithDocker(argv.params);
  } else {
    await testWithoutDocker(argv.params);
  }
}

async function testWithoutDocker(arg) {
  const projectDir = await askForProjectDirectory();

  const spinner = ora('Running your idapp ... \n').start();

  let withProtectedData;
  try {
    withProtectedData = readIDappConfig({ projectDir }).withProtectedData;
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to read idapp.config.json file.');
  }

  try {
    spinner.text = 'Installing dependencies...';
    await execAsync(`cd ${projectDir} && npm ci`);
    spinner.succeed('Dependencies installed.');
  } catch (e) {
    spinner.fail('Failed to install dependencies.');
    console.log(chalk.red('You need to install dotenv and figlet.'));
    return;
  }

  try {
    spinner.text = 'Running iDapp...';
    let command = `cross-env IEXEC_OUT=./${projectDir}/output IEXEC_IN=./${projectDir}/input node ./${projectDir}/src/app.js ${arg}`;
    if (withProtectedData) {
      command = `cross-env IEXEC_OUT=./${projectDir}/output IEXEC_IN=./${projectDir}/input IEXEC_DATASET_FILENAME="protectedData.zip" node ./${projectDir}/src/app.js ${arg}`;
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
      const { stdout } = await execAsync(`cat ${projectDir}/output/result.txt`);
      console.log(stdout);
    }
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to run iDapp.');
    console.log(chalk.red('Failed to execute app.js file.'));
  }
}

export async function testWithDocker(arg) {
  let idappConfig;
  let dockerhubUsername;

  const projectDir = await askForProjectDirectory();

  try {
    idappConfig = await readIDappConfig({ projectDir });
    dockerhubUsername = idappConfig.dockerhubUsername || '';

    const dockerHubUserNameAnswer =
      await promptForDockerHubUsername(dockerhubUsername);
    if (!dockerHubUserNameAnswer) {
      return;
    }

    dockerhubUsername = dockerHubUserNameAnswer;
    idappConfig.dockerhubUsername = dockerHubUserNameAnswer;
    fs.writeFileSync(
      path.join(projectDir, 'idapp.config.json'),
      JSON.stringify(idappConfig, null, 2)
    );

    const installDepSpinner = ora('Installing dependencies...').start();
    await execAsync(`cd ${projectDir} && npm ci`);
    installDepSpinner.succeed('Dependencies installed.');

    await checkDockerDaemon();

    const dockerImageName = projectDir;
    await dockerBuild({
      projectDir,
      dockerHubUser: dockerhubUsername,
      dockerImageName,
      isForTest: idappConfig.withProtectedData || false, // Adjust based on your logic
    });

    await runDockerContainer({
      projectDir,
      dockerhubUsername,
      imageName: dockerImageName,
      arg: arg || 'World',
      withProtectedData: idappConfig.withProtectedData,
    });
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

async function askForProjectDirectory() {
  const projectNames = fs
    .readdirSync('.', { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .filter((dir) => {
      return fs.existsSync(path.join('.', dir.name, 'idapp.config.json'));
    })
    .map((dir) => dir.name);

  const projectName = await select({
    message:
      'What\'s the name of the project you\'d like to test? (Folders containing an "idapp.config.json" file)',
    choices: projectNames.map((projectName) => ({
      name: projectName,
      value: projectName,
    })),
  });

  return projectName;
}
