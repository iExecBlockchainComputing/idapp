import fs from 'node:fs';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { CONFIG_FILE } from '../config/config';

const jsonConfigFileSchema = z.object({
  projectName: z.string(),
  withProtectedData: z.boolean(),
  dockerhubUsername: z.string().optional(),
  dockerhubAccessToken: z.string().optional(),
  walletAddress: z.string().optional(),
});

// Read JSON configuration file
export function readIDappConfig(spinner) {
  let configAsObject;
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    configAsObject = JSON.parse(configContent);
  } catch (err) {
    spinner?.fail(
      `Failed to read ${CONFIG_FILE} file: JSON seems to be invalid.`
    );
    process.exit(1);
  }

  try {
    return jsonConfigFileSchema.parse(configAsObject);
  } catch (err) {
    const validationError = fromError(err);
    spinner?.fail(
      `Failed to read ${CONFIG_FILE} file: ${validationError.toString()}`
    );
    process.exit(1);
  }
}

// Read package.json file
export function readPackageJonConfig() {
  try {
    const packageContent = fs.readFileSync('./package.json', 'utf8');
    return JSON.parse(packageContent);
  } catch (err) {
    console.error(`Failed to read ${CONFIG_FILE} file`, err);
  }
}

// Utility function to write the iDapp JSON configuration file
export function writeIDappConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
