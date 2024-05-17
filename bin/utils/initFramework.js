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
  // Create a simple iDapp configuration file
  const configContent = `const config = {
  accounts: YOUR_PRIVATE_KEY,
};

export default config;
  `;

  await writeFileAsync("idapp.config.js", configContent, "utf8");
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
