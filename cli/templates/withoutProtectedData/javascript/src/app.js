const fsPromises = require('fs').promises;
const figlet = require('figlet');

const main = async () => {
  try {
    const output = process.env.IEXEC_OUT;
    const message =
      process.argv.length > 2 && process.argv[2] !== 'undefined'
        ? process.argv[2]
        : 'World';

    const text = figlet.textSync(`Hello, ${message}!`);

    // Append some results in /iexec_out/
    await fsPromises.writeFile(`${output}/result.txt`, text);
    // Declare everything is computed
    const computedJsonObj = {
      'deterministic-output-path': `${output}/result.txt`,
    };
    await fsPromises.writeFile(
      `${output}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

main();
