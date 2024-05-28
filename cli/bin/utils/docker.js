import os from "os";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function buildDockerImage({
  dockerHubUser,
  dockerImageName,
  isForTest = false,
}) {
  const osType = os.type();
  if (osType === "Darwin") {
    //For MacOS
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
    //For linux or windows
    await execAsync(`docker build -t ${dockerHubUser}/${dockerImageName} .`);
  }
}

export async function getDockerUsername() {
  try {
    // Get the credential store from Docker config
    const credsStoreResult = await execAsync(
      `jq -r .credsStore ~/.docker/config.json`
    );
    const credsStore = credsStoreResult.stdout.trim();

    if (!credsStore) {
      console.log("No credsStore found in Docker config.");
      return;
    }

    // Execute the command to retrieve the Docker username from the credentials list
    const credsListCommand = `docker-credential-${credsStore} list`;
    const credsResult = await execAsync(credsListCommand);
    const credsList = JSON.parse(credsResult.stdout);

    // Extract the username for docker.io using jq filtering
    const usernameCommand = `echo '${JSON.stringify(
      credsList
    )}' | jq -r 'to_entries[] | select(.key | contains("docker.io")) | .value' | head -n 1`;
    const usernameResult = await execAsync(usernameCommand);

    if (usernameResult.stdout.trim()) {
      return usernameResult.stdout.trim();
    } else {
      console.log("Docker username for docker.io not found.");
    }
  } catch (error) {
    console.error("Failed to get Docker username:", error);
  }
}
