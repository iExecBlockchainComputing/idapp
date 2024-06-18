import fs from 'fs';

// Read configuration file
export function readConfig() {
  const configContent = fs.readFileSync('./idapp.config.json', 'utf8');
  const config = JSON.parse(configContent);
  return config;
}
