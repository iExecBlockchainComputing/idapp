import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { createHelloWordFile } from "./utils.js";

const writeFileAsync = util.promisify(fs.writeFile);
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
    await execAsync("mkdir -p ./input && mkdir -p ./output");
    await createHelloWordFile();
  } catch (error) {
    console.log("Error during project initialization:", error);
  }
}

export async function createDockerfileFile() {
  const dockerfilePath = `./Dockerfile`;
  const dockerfileContent = `FROM node:14-alpine3.11
    ### install your dependencies if you have some
    RUN mkdir /app && cd /app && npm install figlet@1.x
    COPY ./src /app
    ENTRYPOINT ["node", "/app/app.js"]`;
  await writeFile(dockerfilePath, dockerfileContent);
}
