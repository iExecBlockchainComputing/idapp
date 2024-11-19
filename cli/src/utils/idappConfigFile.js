import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { CONFIG_FILE } from '../config/config.js';

const jsonConfigFileSchema = z.object({
  projectName: z.string(),
  withProtectedData: z.boolean(),
  dockerhubUsername: z.string().optional(),
  dockerhubAccessToken: z.string().optional(),
  walletAddress: z.string().optional(),
});

// Read JSON configuration file
export async function readIDappConfig(spinner) {
  let configContent;
  let configAsObject;
  try {
    configContent = await readFile(CONFIG_FILE, 'utf8');
  } catch (err) {
    const readableMessage = `Failed to read \`${CONFIG_FILE}\` file. Are you in your idapp project folder?`;
    if (spinner) {
      console.log('\n');
      spinner.fail(readableMessage);
    } else {
      console.error('\n' + readableMessage);
    }
    console.error('\n[readIDappConfig] ERROR', err);
    process.exit(1);
  }

  try {
    configAsObject = JSON.parse(configContent);
  } catch (err) {
    const readableMessage = `Failed to read \`${CONFIG_FILE}\` file, JSON seems to be invalid.`;
    if (spinner) {
      console.log('\n');
      spinner.fail(readableMessage);
    } else {
      console.error('\n' + readableMessage);
    }
    console.error('\n[readIDappConfig] ERROR', err);
    process.exit(1);
  }

  try {
    return jsonConfigFileSchema.parse(configAsObject);
  } catch (err) {
    const validationError = fromError(err);
    const errorMessage = `Failed to read \`${CONFIG_FILE}\` file: ${validationError.toString()}`;
    if (spinner) {
      spinner.fail(errorMessage);
    } else {
      console.error('\n' + errorMessage);
    }
    process.exit(1);
  }
}

// Read package.json file
export async function readPackageJonConfig() {
  try {
    const packageContent = await readFile('./package.json', 'utf8');
    return JSON.parse(packageContent);
  } catch (err) {
    console.error(`Failed to read \`${CONFIG_FILE}\` file.`, err);
  }
}

// Utility function to write the iDapp JSON configuration file
export async function writeIDappConfig(config) {
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
