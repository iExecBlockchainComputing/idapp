import Docker from 'dockerode';

const docker = new Docker();

const registryAuth = {
  username: process.env.REGISTRY_USERNAME,
  password: process.env.REGISTRY_PASSWORD,
  serveraddress: process.env.REGISTRY_SERVERADDRESS,
};

/**
 * @returns {Promise<{ Tag: string, Digest: string, Size: number }>}
 */
export async function pushImage({ targetImagePath, targetImageTag }) {
  console.log(`Pushing image: ${targetImagePath} to DockerHub...`);

  return new Promise((resolve, reject) => {
    const img = docker.getImage(targetImagePath);
    img.push(
      { authconfig: registryAuth, tag: targetImageTag },
      function (err, stream) {
        let pushedImageResult;
        let isError = false;

        if (err) {
          console.error('Error pushing the image:', err);
          return reject(err);
        }

        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(err, output) {
          if (err || isError) {
            console.error('Error in image pushing process:', err);
            return reject(err);
          }
          console.log(
            `Successfully pushed the image to DockerHub => ${targetImagePath}`
          );
          resolve(pushedImageResult);
        }

        function onProgress(event) {
          if (event.error) {
            console.error('[img.push] onProgress ERROR', event.error);
            isError = true;
          } else {
            console.log('[img.push] onProgress', event);
            if (event.aux) {
              pushedImageResult = event.aux;
            }
          }
        }
      }
    );
  });
}
