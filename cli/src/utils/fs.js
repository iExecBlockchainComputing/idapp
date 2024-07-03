import fs from 'fs';
import path from 'path';

// Read configuration file
export function readIDappConfig({ projectDir }) {
  try {
    const configContent = fs.readFileSync(
      path.join(projectDir, 'idapp.config.json'),
      'utf8'
    );
    const config = JSON.parse(configContent);
    return config;
  } catch (err) {
    console.error('Failed to read idapp.config.json file.', err);
  }
}

// Read configuration file
export function readPackageJonConfig({ projectDir }) {
  try {
    const configContent = fs.readFileSync(
      path.join(projectDir, 'package.json'),
      'utf8'
    );
    const config = JSON.parse(configContent);
    return config;
  } catch (err) {
    console.error('Failed to read idapp.config.json file.', err);
  }
}

// Utility function to write the iDapp configuration
export function writeIDappConfig(config) {
  const configPath = 'idapp.config.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
