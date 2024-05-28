import fs from "fs";
import util from "util";

const writeFileAsync = util.promisify(fs.writeFile);
const accessAsync = util.promisify(fs.access);
const mkdir = util.promisify(fs.mkdir);

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
    await accessAsync("./src");
  } catch (error) {
    await mkdir("./src", { recursive: true }); // Create the src directory if it does not exist
  }

  await writeFileAsync(appFilePath, appFileContent);
}
