import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import os from 'os';
import ora from 'ora';
import Docker from 'dockerode';
import inquirer from 'inquirer';

const docker = new Docker();
const execAsync = util.promisify(exec);

export async function checkDockerDaemon() {
  const checkDockerDaemonSpinner = ora(
    'Checking if docker daemon is running ...'
  ).start();
  try {
    await docker.ping();
    checkDockerDaemonSpinner.succeed('Docker daemon is running');
  } catch (e) {
    checkDockerDaemonSpinner.fail('You docker daemon is not up');
    throw new Error(e.message);
  }
}

export async function dockerBuild({
  projectDir,
  dockerHubUser,
  dockerImageName,
  isForTest = false,
}) {
  const osType = os.type();
  const buildSpinner = ora('Building Docker image ...').start();

  let buildArgs = {
    context: path.join(process.cwd(), projectDir), // Use project directory
    src: ['Dockerfile'], // Specify Dockerfile path
  };
  const imageTag = {
    t: `${dockerHubUser}/${dockerImageName}`,
  };
  console.log('imageTag', imageTag);

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
    docker.buildImage(buildArgs, imageTag, (error, stream) => {
      if (error) {
        buildSpinner.fail('Failed to build Docker image.');
        reject(error);
        return;
      }

      docker.modem.followProgress(stream, (err, res) => {
        if (err) {
          buildSpinner.fail('Failed to build Docker image.');
          reject(err);
        } else {
          buildSpinner.succeed('Docker image built.');
          resolve(res);
        }
      });
    });
  });
}

// Function to tag a Docker image
export async function tagDockerImage(dockerhubUsername, imageName, version) {
  const tagSpinner = ora('Tagging Docker image ...').start();
  const image = docker.getImage(`${dockerhubUsername}/${imageName}`);
  await image.tag({
    repo: `${dockerhubUsername}/${imageName}:${version}-debug`,
  });
  tagSpinner.succeed('Docker image tagged.');
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

export async function runDockerContainer({
  projectDir,
  dockerhubUsername,
  imageName,
  arg,
  withProtectedData,
}) {
  let runDockerContainerSpinner = ora('Installing dependencies...').start();
  try {
    // Replace with dockerode logic for running containers
    const container = await docker.createContainer({
      Image: `${dockerhubUsername}/${imageName}`,
      Cmd: [arg],
      HostConfig: {
        Binds: [
          `${process.cwd()}/${projectDir}/input:/iexec_in`,
          `${process.cwd()}/${projectDir}/output:/iexec_out`,
        ],
        AutoRemove: true,
      },
      Env: [
        `IEXEC_IN=/${projectDir}/iexec_in`,
        `IEXEC_OUT=/${projectDir}/iexec_out`,
        withProtectedData
          ? `IEXEC_DATASET_FILENAME=${projectDir}/protectedData.zip`
          : '',
      ].filter(Boolean),
    });

    await container.start();

    // Wait for the container to finish
    await container.wait();
    const logs = await container.logs({ stdout: true, stderr: true });

    runDockerContainerSpinner.succeed('Docker container run successfully.');
    console.log(logs.stdout ? chalk.blue(logs.stdout) : '');
    if (logs.stderr) {
      console.log(chalk.red(logs.stderr));
    }

    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Would you like to see the result? (View output/result.txt)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat output/result.txt');
      console.log(stdout);
    }
  } catch (error) {
    runDockerContainerSpinner.fail('Failed to run Docker container.');
    throw error;
  }
}
