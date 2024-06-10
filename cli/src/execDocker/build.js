import { exec } from 'child_process';
import os from 'os';
import util from 'util';

const execAsync = util.promisify(exec);

export async function execDockerBuild({
  dockerHubUser,
  dockerImageName,
  isForTest = false,
}) {
  const osType = os.type();
  if (osType === 'Darwin') {
    // For MacOS
    if (isForTest) {
      // ARM64 variant for local testing only
      await execAsync(
        `docker buildx build --platform linux/arm64 -t ${dockerHubUser}/${dockerImageName} .`
      );
    } else {
      // AMD64 variant to deploy on iExec
      await execAsync(
        `docker buildx build --platform linux/amd64 -t ${dockerHubUser}/${dockerImageName} .`
      );
    }
  } else {
    // For linux or windows
    await execAsync(`docker build -t ${dockerHubUser}/${dockerImageName} .`);
  }
}
