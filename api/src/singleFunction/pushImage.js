import Docker from "dockerode";
import "dotenv/config";

const docker = new Docker();

const registryAuth = {
  username: process.env.REGISTRY_USERNAME,
  password: process.env.REGISTRY_PASSWORD,
  serveraddress: process.env.REGISTRY_SERVERADDRESS,
};

export async function pushImage(image) {
  console.log(`Pushing image: ${image} to DockerHub...`);

  return new Promise((resolve, reject) => {
    docker.push(image, { authconfig: registryAuth }, function (err, stream) {
      if (err) {
        console.error("Error pushing the image:", err);
        return reject(err);
      }

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) {
          console.error("Error in image pushing process:", err);
          return reject(err);
        }
        console.log(`Successfully pushed the image to DockerHub => ${image}`);
        resolve(output);
      }

      function onProgress(event) {
        console.log(event.status);
      }
    });
  });
}
