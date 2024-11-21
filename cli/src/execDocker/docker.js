import { exec } from 'child_process';
import Docker from 'dockerode';
import inquirer from 'inquirer';
import ora from 'ora';
import os from 'os';
import util from 'util';
import { askForDockerhubAccessToken } from '../utils/askForDockerhubAccessToken.js';
import { askForDockerhubUsername } from '../utils/askForDockerhubUsername.js';
import { IEXEC_WORKER_HEAP_SIZE } from '../config/config.js';

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

// TODO: fix platform for dockerode
export async function dockerBuild({ tag = undefined, isForTest = false }) {
  const osType = os.type();
  const buildSpinner = ora('Building Docker image ...').start();
  const buildArgs = {
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
    t: tag,
    platform,
  });

  const imageId = await new Promise((resolve, reject) => {
    docker.modem.followProgress(buildImageStream, onFinished, onProgress);

    function onFinished(err, output) {
      /**
       * expected output format for image id
       * ```
       *   {
       *    aux: {
       *      ID: 'sha256:e994101ce877e9b42f31f1508e11bbeb8fa5096a1fb2d0c650a6a26797b1906b'
       *    }
       *  },
       * ```
       */
      const builtImageId = output?.find((row) => row?.aux?.ID)?.aux?.ID;

      /**
       * 3 kind of error possible, we want to catch both:
       * - stream error
       * - build error
       * - no image id (should not happen)
       *
       * expected output format for build error
       * ```
       *   {
       *     errorDetail: {
       *       code: 1,
       *       message: "The command '/bin/sh -c npm ci' returned a non-zero code: 1"
       *     },
       *     error: "The command '/bin/sh -c npm ci' returned a non-zero code: 1"
       *   }
       * ```
       */
      const errorOrErrorMessage =
        err || // stream error
        output.find((row) => row?.error)?.error || // build error message
        (!builtImageId && 'Failed to retrieve generated image ID'); // no image id -> error message

      if (errorOrErrorMessage) {
        const error =
          errorOrErrorMessage instanceof Error
            ? errorOrErrorMessage
            : Error(errorOrErrorMessage);
        buildSpinner.fail('Failed to build Docker image.');
        reject(error);
      } else {
        buildSpinner.succeed(
          `Docker image built (${tag ? tag : builtImageId})`
        );
        resolve(builtImageId);
      }
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

  return imageId;
}

// Function to push a Docker image
export async function pushDockerImage({ tag }) {
  // TODO We need to handle this push without asking the user their password (sensitive info!)
  try {
    const dockerHubUsername = await askForDockerhubUsername();
    const dockerHubAccessToken = await askForDockerhubAccessToken();

    if (!dockerHubUsername || !dockerHubAccessToken) {
      throw new Error('DockerHub credentials not found.');
    }
    const dockerPushSpinner = ora('Docker push ...').start();
    const dockerImage = docker.getImage(tag);

    const imagePushStream = await dockerImage.push({
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
        console.log(`Successfully pushed the image to DockerHub => ${tag}`);
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
  image,
  cmd,
  volumes = [],
  env = [],
  memory = undefined,
}) {
  const runDockerContainerSpinner = ora(
    'Setting up Docker container...'
  ).start();

  try {
    const container = await docker.createContainer({
      Image: image,
      Cmd: cmd,
      HostConfig: {
        Binds: volumes,
        AutoRemove: true,
        Memory: memory,
      },
      Env: env,
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
    const { State } = await container.inspect();

    // report status
    if (State.OOMKilled) {
      runDockerContainerSpinner.fail(
        `Docker container ran out of memory, ${Math.floor(memory / (1024 * 1024))}Mb limit exceeded`
      );
    } else if (State.ExitCode === 0) {
      runDockerContainerSpinner.succeed('Docker container run successfully.');
    } else {
      runDockerContainerSpinner.fail(
        `Docker container exited with error (Exit code: ${State.ExitCode})`
      );
    }
  } catch (error) {
    runDockerContainerSpinner.fail('Failed to run Docker container.');
    throw error;
  } finally {
    runDockerContainerSpinner.stop();
  }
}
