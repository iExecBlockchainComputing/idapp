import chalk from 'chalk';
import { readIDappConfig, writeIDappConfig } from '../utils/idappConfigFile.js';
import { CONFIG_FILE } from '../config/config.js';

export async function askForDockerhubAccessToken({ spinner }) {
  const config = await readIDappConfig();

  const dockerhubAccessToken = config.dockerhubAccessToken || '';
  if (dockerhubAccessToken) {
    spinner.log(`Using saved dockerhubAccessToken (from "${CONFIG_FILE}")`);
    return dockerhubAccessToken;
  }

  spinner.log(
    'Go to your docker hub account: https://hub.docker.com/settings/security'
  );
  spinner.log('click on "Personal access tokens"');
  spinner.log('click on "Generate new token"');
  spinner.log('you can name it "Test iExec iDapp CLI"');
  spinner.log('and select "Read & Write" Access permissions');
  const { dockerHubAccessTokenAnswer } = await spinner.prompt({
    type: 'password',
    name: 'dockerHubAccessTokenAnswer',
    message:
      'What is your DockerHub access token? (It will be used to push the docker image to your account)',
    mask: '*',
  });

  // TODO check token against API
  if (!/[a-zA-Z0-9-]+/.test(dockerHubAccessTokenAnswer)) {
    spinner.log(chalk.red('Invalid DockerHub access token.'));
    return askForDockerhubAccessToken({ spinner });
  }

  // Save it into JSON config file
  config.dockerhubAccessToken = dockerHubAccessTokenAnswer;
  await writeIDappConfig(config);
  spinner.log(`dockerhubAccessToken saved to "${CONFIG_FILE}"`);

  return dockerHubAccessTokenAnswer;
}
