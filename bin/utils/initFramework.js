import util from "util";
import { exec } from "child_process";
import fs from "fs";
const writeFileAsync = util.promisify(fs.writeFile);

import {
  createDockerfileFile,
  createHelloWordFile,
  setUpTestFile,
} from "./utils.js";

const execAsync = util.promisify(exec);

async function createConfigurationFiles() {
  const chainJson = {
    default: "bellecour",
    chains: {
      mainnet: {},
      bellecour: {},
    },
  };
  const iexecJson = {
    description:
      "My iExec resource description, must be at least 150 chars long in order to pass the validation checks. Describe your application, dataset or workerpool to your users",
    license: "MIT",
    author: "?",
    social: {
      website: "?",
      github: "?",
    },
    logo: "logo.png",
  };

  await writeFileAsync(
    "chain.json",
    JSON.stringify(chainJson, null, 2),
    "utf8"
  );
  await writeFileAsync(
    "iexec.json",
    JSON.stringify(iexecJson, null, 2),
    "utf8"
  );
}

export async function initFrameworkForJavascript() {
  try {
    await execAsync("npm init -y");
    await createConfigurationFiles();
    await createDockerfileFile();
    await createHelloWordFile();
    await setUpTestFile();
  } catch (error) {
    console.log("Error during project initialization:", error);
  }
}
