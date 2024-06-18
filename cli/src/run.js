import { readIDappConfig } from './utils/readConfig.js';

export async function run() {
  const spinner = ora('Running your idapp on iexec protocol ... \n').start();

  let withProtectedData;
  try {
    withProtectedData = readIDappConfig().withProtectedData;
  } catch (err) {
    console.log('err', err);
    spinner.fail('Failed to read idapp.config.json file.');
  }
    
    
}
