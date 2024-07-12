import chalk from 'chalk';
import inquirer from 'inquirer';
import { readIDappConfig, writeIDappConfig } from './idappConfigFile.js';

export async function askForDockerhubAccessToken() {
  const dockerhubAccessToken = readIDappConfig().dockerhubAccessToken || '';
  if (dockerhubAccessToken) {
    console.log('Using saved dockerhubAccessToken (from "idapp.config.json")');
    return dockerhubAccessToken;
  }

  console.info(
    'Got to your docker hub account: https://hub.docker.com/settings/security'
  );
  console.log('and click on "New Access Token"');
  console.log('You can name it "Test iExec iDapp CLI"');
  console.log('and select "Read & Write" Access permissions');
  const { dockerHubAccessTokenAnswer } = await inquirer.prompt({
    type: 'password',
    name: 'dockerHubAccessTokenAnswer',
    message:
      'What is your Docker Hub access token? (It will be used to push the docker image to your account)',
    mask: '*',
  });

  // Save it into JSON config file
  const config = readIDappConfig();
  config.dockerhubAccessToken = dockerHubAccessTokenAnswer;
  writeIDappConfig(config);
  console.log('dockerhubAccessToken saved to "idapp.config.json"');

  return dockerHubAccessTokenAnswer;
}
