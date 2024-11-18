import fs from 'node:fs';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';

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
    const configContent = fs.readFileSync('./idapp.config.json', 'utf8');
    configAsObject = JSON.parse(configContent);
  } catch (err) {
    const readableMessage =
      'Failed to read idapp.config.json file: JSON seems to be invalid.';
    if (spinner) {
      spinner.fail(readableMessage);
    } else {
      console.error(readableMessage);
    }
    console.error('[readIDappConfig] ERROR', err);
    process.exit(1);
  }

  try {
    return jsonConfigFileSchema.parse(configAsObject);
  } catch (err) {
    const validationError = fromError(err);
    const errorMessage =
      'Failed to read idapp.config.json file: ' + validationError.toString();
    if (spinner) {
      spinner.fail(errorMessage);
    } else {
      console.error(errorMessage);
    }
    process.exit(1);
  }
}

// Read package.json file
export function readPackageJonConfig() {
  try {
    const packageContent = fs.readFileSync('./package.json', 'utf8');
    return JSON.parse(packageContent);
  } catch (err) {
    console.error('Failed to read idapp.config.json file.', err);
  }
}

// Utility function to write the iDapp JSON configuration file
export function writeIDappConfig(config) {
  const configPath = 'idapp.config.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
