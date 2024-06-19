import fs from 'fs';

// Read configuration file
export function readIDappConfig() {
  try {
    const configContent = fs.readFileSync('./idapp.config.json', 'utf8');
    const config = JSON.parse(configContent);
    return config;
  } catch (err) {
    console.error('Failed to read idapp.config.json file.', err);
  }
}

// Read configuration file
export function readPackageJonConfig() {
  try {
    const configContent = fs.readFileSync('./package.json', 'utf8');
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
