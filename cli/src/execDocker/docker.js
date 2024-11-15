import { exec } from 'child_process';
import Docker from 'dockerode';
import inquirer from 'inquirer';
import ora from 'ora';
import os from 'os';
import util from 'util';
import { askForDockerhubAccessToken } from '../utils/askForDockerhubAccessToken.js';
import { askForDockerhubUsername } from '../utils/askForDockerhubUsername.js';

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
    process.exit(1);
  }
}

// TODO: fix plateform for dockerode
export async function dockerBuild({
  dockerHubUser,
  dockerImageName,
  isForTest = false,
}) {
  const osType = os.type();
  const buildSpinner = ora('Building Docker image ...').start();
  let buildArgs = {
    context: process.cwd(), // Use current working directory
    src: ['./'],
  };

  let platform;
  if (osType === 'Darwin') {
    // For MacOS
    if (isForTest) {
      // ARM64 variant for local testing only
      platform = 'linux/arm64';
    } else {
      // AMD64 variant to deploy to iExec stack
      platform = 'linux/amd64';
    }
  }

  // Perform the Docker build operation
  const buildImageStream = await docker.buildImage(buildArgs, {
    t: `${dockerHubUser}/${dockerImageName}`,
    platform,
  });

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(buildImageStream, onFinished, onProgress);

    function onFinished(err, _output) {
      if (err) {
        buildSpinner.fail('Failed to build Docker image.');
        return reject(err);
      }
      buildSpinner.succeed('Docker image built.');
      resolve();
    }

    function onProgress(event) {
      if (event?.stream) {
        if (event.stream !== '\n') {
          console.log(event.stream);
        }
        return;
      }
      console.log(event);
    }
  });
}

// Function to tag a Docker image
export async function tagDockerImage(dockerhubUsername, imageName, version) {
  const tagSpinner = ora('Tagging Docker image ...').start();
  console.log(`${dockerhubUsername}/${imageName}`);
  const image = docker.getImage(`${dockerhubUsername}/${imageName}`);
  await image.tag({
    repo: `${dockerhubUsername}/${imageName}:${version}-debug`,
  });
  tagSpinner.succeed('Docker image tagged.');
}

// Function to push a Docker image
export async function pushDockerImage(dockerhubUsername, imageName, version) {
  // TODO Probably no need to ask again for dockerHubUsername, we have it in idapp.config.json
  // TODO We need to handle this push without asking the user their password (sensitive info!)
  try {
    const dockerHubUsername = await askForDockerhubUsername();
    const dockerHubAccessToken = await askForDockerhubAccessToken();

    if (!dockerHubUsername || !dockerHubAccessToken) {
      throw new Error('DockerHub credentials not found.');
    }

    const imageFullName = `${dockerhubUsername}/${imageName}:${version}-debug`;
    const dockerPushSpinner = ora('Docker push ...').start();
    const image = docker.getImage(imageFullName);

    const imagePushStream = await image.push({
      authconfig: {
        username: dockerHubUsername,
        password: dockerHubAccessToken,
      },
    });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(imagePushStream, onFinished, onProgress);

      function onFinished(err, _output) {
        if (err) {
          console.error('Error in image pushing process:', err);
          return reject(err);
        }
        console.log(
          `Successfully pushed the image to DockerHub => ${imageFullName}`
        );
        resolve();
      }

      function onProgress(event) {
        if (event.error) {
          console.error('[img.push] onProgress ERROR', event.error);
        } else {
          console.log('[img.push] onProgress', event);
        }
      }
    });

    dockerPushSpinner.succeed('Docker image pushed.');
  } catch (error) {
    console.error('Error pushing Docker image:', error);
    throw error; // Re-throwing the error for higher-level handling if needed
  }
}

export async function runDockerContainer({
  dockerhubUsername,
  imageName,
  arg,
  withProtectedData,
}) {
  const runDockerContainerSpinner = ora(
    'Setting up Docker container...'
  ).start();

  try {
    const container = await docker.createContainer({
      Image: `${dockerhubUsername}/${imageName}`,
      Cmd: [arg],
      HostConfig: {
        Binds: [
          `${process.cwd()}/input:/iexec_in`,
          `${process.cwd()}/output:/iexec_out`,
        ],
        AutoRemove: true,
      },
      Env: [
        `IEXEC_IN=/iexec_in`,
        `IEXEC_OUT=/iexec_out`,
        ...(withProtectedData
          ? [`IEXEC_DATASET_FILENAME=protectedData.zip`]
          : []),
      ],
    });

    // Attach to container output stream for real-time logging
    container.attach(
      { stream: true, stdout: true, stderr: true },
      function (err, stream) {
        if (err) {
          console.error('Error attaching to container:', err);
          runDockerContainerSpinner.fail(
            'Failed to attach to Docker container.'
          );
          throw err;
        }

        stream.pipe(process.stdout); // Pipe container output to stdout
      }
    );

    // Start the container
    await container.start();
    runDockerContainerSpinner.text = 'Running Docker container...';

    // Wait for the container to finish
    await container.wait();

    // Check container status after waiting
    const containerInspect = await container.inspect();
    if (containerInspect.State.Status !== 'exited') {
      runDockerContainerSpinner.succeed('Docker container run successfully.');
    } else {
      runDockerContainerSpinner.fail('Docker container exited unexpectedly.');
      throw new Error('Docker container exited unexpectedly.');
    }

    // Prompt user to view result
    const continueAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Would you like to see the result? (View output/result.txt)',
    });
    if (continueAnswer.continue) {
      const { stdout } = await execAsync('cat output/result.txt');
      console.log(stdout.toString());
    }
  } catch (error) {
    runDockerContainerSpinner.fail('Failed to run Docker container.');
    throw error;
  } finally {
    runDockerContainerSpinner.stop();
  }
}
