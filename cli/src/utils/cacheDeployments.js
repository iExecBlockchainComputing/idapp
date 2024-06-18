import fs from 'fs';
import path from 'path';

// Utility function to create cache/deployments.json if it doesn't exist
function ensureCacheFileExists() {
  const cacheDir = path.join(__dirname, 'cache');
  const cacheFile = path.join(cacheDir, 'deployments.json');

  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }

  // Create deployments.json file if it doesn't exist
  if (!fs.existsSync(cacheFile)) {
    fs.writeFileSync(cacheFile, JSON.stringify([]));
  }

  return cacheFile;
}

// Function to add deployment data to deployments.json
export function addDeploymentData(
  sconifiedImage,
  appContractAddress,
  transferAppTxHash
) {
  const cacheFile = ensureCacheFileExists();
  const currentDate = new Date().toISOString();

  const deploymentData = {
    date: currentDate,
    sconifiedImage,
    appContractAddress,
    transferAppTxHash,
  };

  const existingData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  existingData.push(deploymentData);

  fs.writeFileSync(cacheFile, JSON.stringify(existingData, null, 2));
}
