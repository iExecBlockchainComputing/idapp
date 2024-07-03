import inquirer from 'inquirer';

export async function promptForDockerHubUsername(currentUsername) {
  try {
    if (currentUsername) {
      return currentUsername;
    }

    const { dockerHubUserNameAnswer } = await inquirer.prompt({
      type: 'input',
      name: 'dockerHubUserNameAnswer',
      message:
        'What is your username on Docker Hub? (It will be used to properly tag the Docker image)',
    });

    if (!/^[a-zA-Z0-9-]+$/.test(dockerHubUserNameAnswer)) {
      return null;
    }

    return dockerHubUserNameAnswer;
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    return null;
  } finally {
  }
}
