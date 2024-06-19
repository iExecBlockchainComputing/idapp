import fs from 'fs';

// Utility function to ensure the cache directory and file exist
function ensureCacheFileExists(fileName) {
  const cacheDir = 'cache';
  const cacheFile = `${cacheDir}/${fileName}`;

  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }

  // Create the specified cache file if it doesn't exist
  if (!fs.existsSync(cacheFile)) {
    fs.writeFileSync(cacheFile, JSON.stringify([]));
  }

  return cacheFile;
}

// Utility function to add data to the specified cache file
function addDataToCache(fileName, data) {
  const cacheFile = ensureCacheFileExists(fileName);
  const existingData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  existingData.push(data);
  fs.writeFileSync(cacheFile, JSON.stringify(existingData, null, 2));
}

// Function to add run data to runs.json
export function addRunData({ iDappAddress, dealid, txHash }) {
  const currentDate = new Date().toISOString();
  const runData = {
    date: currentDate,
    iDappAddress,
    dealid,
    txHash,
  };
  addDataToCache('runs.json', runData);
}

// Function to add deployment data to deployments.json
export function addDeploymentData({
  sconifiedImage,
  appContractAddress,
  transferAppTxHash,
}) {
  const currentDate = new Date().toISOString();
  const deploymentData = {
    date: currentDate,
    sconifiedImage,
    appContractAddress,
    transferAppTxHash,
  };
  addDataToCache('deployments.json', deploymentData);
}
