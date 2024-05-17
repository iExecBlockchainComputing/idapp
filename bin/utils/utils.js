import fs from "fs";
import util from "util";
import { exec } from "child_process";

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);
const execAsync = util.promisify(exec);

export async function createDockerfileFile() {
  const dockerfilePath = `./Dockerfile`;
  const dockerfileContent = `FROM node:14-alpine3.11
    ### install your dependencies if you have some
    RUN mkdir /app && cd /app && npm install figlet@1.x
    COPY ./src /app
    ENTRYPOINT ["node", "/app/app.js"]`;
  await writeFile(dockerfilePath, dockerfileContent);
}

export async function createHelloWordFile() {
  const appFilePath = `./src/app.js`;
  const appFileContent = `
  const fsPromises = require("fs").promises;
  const figlet = require("figlet");
  
  const main = async () => {
    try {
      const output = process.env.IEXEC_OUT;
      const message = process.argv.length > 2 ? process.argv[2] : "World";
  
      const text = figlet.textSync(\`Hello, \${message}!\`);
      console.log(text);
      // Append some results in /iexec_out/
      await fsPromises.writeFile(\`\${output}/result.txt\`, text);
      // Declare everything is computed
      const computedJsonObj = {
        "deterministic-output-path": \`\${output}/result.txt\`,
      };
      await fsPromises.writeFile(
        \`\${output}/computed.json\`,
        JSON.stringify(computedJsonObj)
      );
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  };
  
  main();`;

  try {
    await access("./src");
  } catch (error) {
    await mkdir("./src", { recursive: true }); // Create the src directory if it does not exist
  }

  await writeFile(appFilePath, appFileContent);
}

export async function updateChainForDebug() {
  const filePath = "./chain.json";
  const data = await readFile(filePath, "utf8");
  const json = JSON.parse(data);
  if (json.chains?.bellecour) {
    json.chains.bellecour.sms = {
      scone: "https://sms.scone-debug.v8-bellecour.iex.ec",
    };
    await writeFile(filePath, JSON.stringify(json, null, 2));
  } else {
    console.log(
      chalk.red("The 'bellecour' chain does not exist in the JSON structure.")
    );
  }
}

export async function removeChainForProd() {
  const filePath = "./chain.json";
  const data = await readFile(filePath, "utf8");
  const json = JSON.parse(data);

  if (json.chains?.bellecour?.sms) {
    delete json.chains.bellecour.sms;
    await writeFile(filePath, JSON.stringify(json, null, 2));
  }
}
