import ora from 'ora';
import os from 'os';
import Docker from 'dockerode';
import inquirer from 'inquirer';

const docker = new Docker();

export async function dockerBuild({
  dockerHubUser,
  dockerImageName,
  isForTest = false,
}) {
  const osType = os.type();

  let buildArgs = {
    context: process.cwd(), // Use current working directory
    src: ['Dockerfile'], // Specify Dockerfile path
    t: `${dockerHubUser}/${dockerImageName}`, // Tag for the image
  };

  if (osType === 'Darwin') {
    // For MacOS
    if (isForTest) {
      // ARM64 variant for local testing only
      buildArgs.platform = 'linux/arm64';
    } else {
      // AMD64 variant to deploy on iExec
      buildArgs.platform = 'linux/amd64';
    }
  }

  // Perform the Docker build operation
  return new Promise((resolve, reject) => {
    docker.buildImage(buildArgs, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      docker.modem.followProgress(stream, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
}

// Function to tag a Docker image
export async function tagDockerImage(dockerhubUsername, imageName, version) {
  const image = docker.getImage(`${dockerhubUsername}/${imageName}`);
  await image.tag({
    repo: `${dockerhubUsername}/${imageName}:${version}-debug`,
  });
}

// Function to push a Docker image
export async function pushDockerImage(dockerhubUsername, imageName, version) {
  const { dockerHubUsername, dockerHubPassword } = await getDockerCredentials();

  const dockerPushSpinner = ora('Docker push ...').start();
  const image = docker.getImage(
    `${dockerhubUsername}/${imageName}:${version}-debug`
  );
  dockerPushSpinner.succeed('Docker image pushed.');

  await image.push({
    authconfig: {
      username: dockerHubUsername,
      password: dockerHubPassword,
    },
  });
}

async function getDockerCredentials() {
  try {
    // Prompt user for Docker Hub credentials
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'dockerHubUsername',
        message: 'Enter your Docker Hub username:',
      },
      {
        type: 'password',
        name: 'dockerHubPassword',
        message: 'Enter your Docker Hub password:',
        mask: '*',
      },
    ]);

    return answers;
  } catch (err) {
    console.error('Failed to retrieve or save Docker credentials:', err);
    throw err;
  }
}
