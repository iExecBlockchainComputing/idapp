import util from "util";
import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";
import { buildDockerImage, getDockerUsername } from "./utils/docker.js";
import { createDockerfileFile } from "./utils/initFramework.js";

const execAsync = util.promisify(exec);

export async function handleTestCommand(argv) {
  if (argv.docker) {
    await testWithDocker();
  } else {
    await testWithoutDocker();
  }
}

async function testWithoutDocker() {
  const spinner = ora("Running your idapp ... \n").start();
  try {
    spinner.text = "Installing dependencies...";
    await execAsync("npm i figlet");
    spinner.succeed("Dependencies installed.");
  } catch (e) {
    spinner.fail("Failed to install dependencies.");
    console.log(chalk.red("You need to install dotenv and figlet."));
    return;
  }

  try {
    spinner.text = "Running iDapp...";
    const { stdout, stderr } = await execAsync(
      "IEXEC_OUT=./output IEXEC_IN=./input node ./src/app.js"
    );
    spinner.succeed("Run completed.");
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));
  } catch (e) {
    spinner.fail("Failed to run iDapp.");
    console.log(chalk.red("Failed to execute app.js file."));
    return;
  }
}

async function testWithDocker() {
  const spinner = ora("Running your idapp ... \n").start();
  await createDockerfileFile();

  try {
    spinner.text = "Checking Docker daemon...";
    await execAsync("docker info");
    spinner.succeed("Docker daemon is running.");
  } catch (e) {
    spinner.fail("Docker daemon is not running.");
    console.log(
      chalk.red("Your Docker daemon is not up... Start your Docker daemon")
    );
    return;
  }

  try {
    spinner.text = "Logging in to Docker...";
    await execAsync("docker login");
    spinner.succeed("Docker login successful.");
  } catch (e) {
    spinner.fail("Docker login failed.");
    console.log(chalk.red("You are not logged in to Docker..."));
    return;
  }

  let dockerUsername;
  try {
    spinner.text = "Getting Docker username...";
    dockerUsername = await getDockerUsername();
    spinner.succeed("Docker username obtained.");
  } catch (e) {
    spinner.fail("Failed to get Docker username.");
    console.log(chalk.red("Failed to get Docker username."));
    return;
  }

  const dockerImageName = "hello-world";
  try {
    spinner.text = "Building Docker image...";
    await buildDockerImage({
      dockerHubUser: dockerUsername,
      dockerImageName,
      isForTest: true,
    });
    spinner.succeed("Docker image built.");
  } catch (e) {
    spinner.fail("Failed to build Docker image.");
    console.log(chalk.red(`Failed to build Docker image: ${e.message}`));
    return;
  }

  try {
    spinner.text = "Running Docker container...";
    const { stdout, stderr } = await execAsync(
      `docker run --rm -v ./tmp/iexec_in:/iexec_in -v ./tmp/iexec_out:/iexec_out -e IEXEC_IN=/iexec_in -e IEXEC_OUT=/iexec_out ${dockerUsername}/${dockerImageName}`
    );
    spinner.succeed("Docker container run successfully.");
    console.log(stderr ? chalk.red(stderr) : chalk.blue(stdout));
  } catch (e) {
    spinner.fail("Failed to run Docker container.");
    console.log(chalk.red(`Failed to run Docker container: ${e.message}`));
  } finally {
    spinner.stop();
  }
}