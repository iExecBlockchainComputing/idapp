import chalk from 'chalk';
import inquirer from 'inquirer';
import { readIDappConfig, writeIDappConfig } from './idappConfigFile.js';

export async function askForDockerhubUsername() {
  const dockerhubUsername = readIDappConfig().dockerhubUsername || '';
  if (dockerhubUsername) {
    console.log(
      `Using saved dockerhubUsername (from "idapp.config.json") -> ${dockerhubUsername}`
    );
    return dockerhubUsername;
  }

  const { dockerHubUserNameAnswer } = await inquirer.prompt({
    type: 'input',
    name: 'dockerHubUserNameAnswer',
    message:
      'What is your username on Docker Hub? (It will be used to properly tag the Docker image)',
  });

  if (!/[a-zA-Z0-9-]+/.test(dockerHubUserNameAnswer)) {
    console.log(
      chalk.red(
        'Invalid Docker Hub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
      )
    );
    return;
  }

  // Save it into JSON config file
  const config = readIDappConfig();
  config.dockerhubUsername = dockerHubUserNameAnswer;
  writeIDappConfig(config);
  console.log('dockerhubUsername saved to "idapp.config.json"');

  return dockerHubUserNameAnswer;
}
