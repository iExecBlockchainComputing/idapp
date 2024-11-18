import { writeFile } from 'fs/promises';
import figlet from 'figlet';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
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

    let file;
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      file = await deserializer.getValue('email', 'string');
    } catch (e) {
      file = 'Missing protectedData';
      console.log('It seems there is an issue with your protected data:', e);
    }

    // Write result to /iexec_out/
    const combinedContent = `${asciiArtText}\n Your Protected Data content: ${file}`;
    await writeFile(`${output}/result.txt`, combinedContent);

    // Build and save a "computed.json" file
    const computedJsonObj = {
      'deterministic-output-path': `${output}/result.txt`,
    };
    await writeFile(`${output}/computed.json`, JSON.stringify(computedJsonObj));
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

main();
