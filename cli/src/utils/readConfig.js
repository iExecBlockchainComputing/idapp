import fs from 'fs';

// Read configuration file
export function readConfig() {
  try {
    const configContent = fs.readFileSync('./idapp.config.json', 'utf8');
    const config = JSON.parse(configContent);
    return config;
  } catch (err) {
    console.error('Failed to read idapp.config.json file.', err);
  }
}
