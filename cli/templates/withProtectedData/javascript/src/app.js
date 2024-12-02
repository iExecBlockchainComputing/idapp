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

    let protectedName;
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      // The protected data created for the purpose of this Hello World journey
      // contains a string with the key "name"
      // 1- "idapp test": The protected data is simply a zip file in the /input folder
      // 2- "idapp run": Pass it a real protected data address:
      //    `idapp run <your idapp address> --protectedData 0x3FFb9D62b527b32230DFf094D24A661495aDb0B4`
      protectedName = await deserializer.getValue('name', 'string');
    } catch (e) {
      protectedName = 'World';
      console.log('It seems there is an issue with your protected data:', e);
    }

    // Transform input text into an ASCII Art text
    const asciiArtText = figlet.textSync(`Hello, ${protectedName}!`);

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
};

main();
