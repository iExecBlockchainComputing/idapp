import fs from "fs";
import ora from "ora";
import util from "util";
import chalk from "chalk";
import inquirer from "inquirer";
import { exec } from "child_process";
import { buildDockerImage, getDockerUsername } from "./utils/docker.js";
import { createDockerfileFile } from "./utils/initFramework.js";

const readFile = util.promisify(fs.readFile);
const execAsync = util.promisify(exec);

export async function handleDeployCommand(argv) {
  let sconifyAnswer;
  let idappVersion;

  if (!argv.prod && !argv.debug) {
    sconifyAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "sconify",
        message: "Would you like to deploy your idapp for prod or debug?",
        choices: ["Debug", "Prod"],
        default: 0, // Default to 'Debug'
      },
    ]);
  }

  const versionAnswer = await inquirer.prompt([
    {
      type: "input",
      name: "version",
      message: "Please enter the version of your iDapp:",
      default: "0.1.0",
    },
  ]);
  idappVersion = versionAnswer.version;

  const mainSpinner = ora("Start deploying your idapp ...").start();

  const data = await readFile("./package.json", "utf8");
  const packageJson = JSON.parse(data);
  const iDappName = packageJson.name.toLowerCase();

  let stepSpinner;
  try {
    stepSpinner = ora("Checking Docker daemon...").start();
    await execAsync("docker info");
    stepSpinner.succeed("Docker daemon is running.");
  } catch (e) {
    stepSpinner.fail("Docker daemon is not running.");
    console.log(
      chalk.red("Your Docker daemon is not up... Start your Docker daemon")
    );
    mainSpinner.fail("Failed to deploy your idapp.");
    return;
  }

  try {
    stepSpinner = ora("Logging in to Docker...").start();
    await execAsync("docker login");
    stepSpinner.succeed("Docker login successful.");
  } catch (e) {
    stepSpinner.fail("Docker login failed.");
    console.log(chalk.red("You are not logged in to Docker..."));
    mainSpinner.fail("Failed to deploy your idapp.");
    return;
  }

  try {
    stepSpinner = ora("Creating dockerfile...").start();
    await createDockerfileFile();
    stepSpinner.succeed("Dockerfile created.");
  } catch (e) {
    stepSpinner.fail("Failed to create dockerfile.");
    console.log(chalk.red("Permission denied..."));
    mainSpinner.fail("Failed to deploy your idapp.");
    return;
  }

  let dockerUsername;
  try {
    stepSpinner = ora("Getting Docker username...").start();
    dockerUsername = await getDockerUsername();
    stepSpinner.succeed("Docker username obtained.");
  } catch (e) {
    stepSpinner.fail("Failed to get Docker username.");
    console.log(chalk.red("Failed to get Docker username."));
    mainSpinner.fail("Failed to deploy your idapp.");
    return;
  }

  if (argv.debug || sconifyAnswer?.sconify === "Debug") {
    try {
      stepSpinner = ora("Building Docker image...").start();
      await buildDockerImage({
        dockerHubUser: dockerUsername,
        dockerImageName: iDappName,
      });
      stepSpinner.succeed("Docker image built.");

      stepSpinner = ora("Tagging Docker image...").start();
      await execAsync(
        `docker tag ${dockerUsername}/${iDappName} ${dockerUsername}/${iDappName}:${idappVersion}-debug`
      );
      stepSpinner.succeed("Docker image tagged.");

      stepSpinner = ora("Pushing Docker image...").start();
      await execAsync(
        `docker push ${dockerUsername}/${iDappName}:${idappVersion}-debug`
      );
      stepSpinner.succeed("Docker image pushed.");
      // TODO: Connect to the SCONIFY API
    } catch (e) {
      stepSpinner.fail(
        "An error occurred during the debug deployment process."
      );
      console.log(chalk.red(`Error: ${e.message}`));
      mainSpinner.fail("Failed to deploy your idapp.");
      return;
    }
  }

  if (argv.prod || sconifyAnswer?.sconify === "Prod") {
    try {
      // TODO: Connect to the SCONIFY API
    } catch (e) {
      stepSpinner.fail(
        "An error occurred during the production deployment process."
      );
      console.log(chalk.red(`Error: ${e.message}`));
      mainSpinner.fail("Failed to deploy your idapp.");
      return;
    }
  }

  mainSpinner.succeed("Deployment of your idapp completed successfully.");
}
