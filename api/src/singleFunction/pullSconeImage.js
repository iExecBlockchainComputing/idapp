import Docker from 'dockerode';

const docker = new Docker();

const registryAuth = {
  username: process.env.SCONTAIN_REGISTRY_USERNAME,
  password: process.env.SCONTAIN_REGISTRY_PASSWORD,
  serveraddress: process.env.SCONTAIN_REGISTRY_SERVERADDRESS,
};

export function pullSconeImage(image) {
  if (
    !process.env.SCONTAIN_REGISTRY_USERNAME ||
    !process.env.SCONTAIN_REGISTRY_PASSWORD ||
    !process.env.SCONTAIN_REGISTRY_SERVERADDRESS
  ) {
    throw new Error(
      'Missing env vars: SCONTAIN_REGISTRY_USERNAME, SCONTAIN_REGISTRY_PASSWORD, SCONTAIN_REGISTRY_SERVERADDRESS are required'
    );
  }

  console.log(`Pulling image: ${image}...`);

  return new Promise((resolve, reject) => {
    docker.pull(image, { authconfig: registryAuth }, function (err, stream) {
      if (err) {
        console.error('Error pulling the image:', err);
        return reject(err);
      }

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) {
          console.error('Error in image pulling process:', err);
          return reject(err);
        }
        console.log(`Image ${image} pulled successfully.`);
        resolve(output);
      }

      function onProgress(event) {
        console.log(event.status);
      }
    });
  });
}
