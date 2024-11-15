import fs from 'node:fs';

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
  existingData.unshift(data); // Add the new data to the beginning of the array
  fs.writeFileSync(cacheFile, JSON.stringify(existingData, null, 2));
}

// Utility function to format date in Europe/Paris timezone
function getFormattedDateInParis() {
  const options = {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const [
    { value: day },
    ,
    { value: month },
    ,
    { value: year },
    ,
    { value: hour },
    ,
    { value: minute },
    ,
    { value: second },
  ] = formatter.formatToParts(new Date());
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Function to add run data to runs.json
export function addRunData({ iDappAddress, dealid, txHash }) {
  const formattedDate = getFormattedDateInParis();
  const runData = {
    date: formattedDate,
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
  owner,
}) {
  const formattedDate = getFormattedDateInParis();
  const deploymentData = {
    date: formattedDate,
    sconifiedImage,
    appContractAddress,
    owner,
  };
  addDataToCache('deployments.json', deploymentData);
}
