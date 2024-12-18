import chalk from 'chalk';
import { readIAppConfig, writeIAppConfig } from '../utils/iAppConfigFile.js';
import { CONFIG_FILE } from '../config/config.js';

export async function askForDockerhubUsername({ spinner }) {
  const config = await readIAppConfig();

  const dockerhubUsername = config.dockerhubUsername || '';
  if (dockerhubUsername) {
    spinner.log(
      `Using saved dockerhubUsername (from "${CONFIG_FILE}") -> ${dockerhubUsername}`
    );
    return dockerhubUsername;
  }

  const { dockerHubUserNameAnswer } = await spinner.prompt({
    type: 'text',
    name: 'dockerHubUserNameAnswer',
    message:
      'What is your username on DockerHub? (It will be used to properly tag the Docker image)',
  });

  // TODO check username against API
  if (!/[a-zA-Z0-9-]+/.test(dockerHubUserNameAnswer)) {
    spinner.log(
      chalk.red(
        'Invalid DockerHub username. Login to https://hub.docker.com/repositories, your username is what gets added to this URL.'
      )
    );
    return askForDockerhubUsername({ spinner });
  }

  // Save it into JSON config file
  config.dockerhubUsername = dockerHubUserNameAnswer;
  await writeIAppConfig(config);
  spinner.log(`dockerhubUsername saved to "${CONFIG_FILE}"`);

  return dockerHubUserNameAnswer;
}
