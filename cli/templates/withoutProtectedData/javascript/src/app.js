import { writeFile } from 'fs/promises';
import figlet from 'figlet';

async function main() {
  try {
    const output = process.env.IEXEC_OUT;

    // Example of process.argv:
    // [ '/usr/local/bin/node', '/app/src/app.js', 'Bob' ]
    const message =
      !!process.argv?.[2] && process.argv[2] !== 'undefined'
        ? process.argv[2]
        : 'World';

    // Transform input text into an ASCII Art text
    const asciiArtText = figlet.textSync(`Hello, ${message}!`);

    // Write result to /iexec_out/
    await writeFile(`${output}/result.txt`, asciiArtText);

    // Build and save a "computed.json" file
    const computedJsonObj = {
      'deterministic-output-path': `${output}/result.txt`,
    };
    await writeFile(`${output}/computed.json`, JSON.stringify(computedJsonObj));
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
