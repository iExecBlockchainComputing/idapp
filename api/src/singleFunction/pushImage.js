import Docker from 'dockerode';

const docker = new Docker();

/**
 * @returns {Promise<{ Tag: string, Digest: string, Size: number }>}
 */
export async function pushImage({ targetImagePath, targetImageTag }) {
  console.log(`Pushing image: ${targetImagePath} to DockerHub...`);

  return new Promise((resolve, reject) => {
    const img = docker.getImage(targetImagePath);
    img.push({ tag: targetImageTag }, function (err, stream) {
      let pushedImageResult;

      if (err) {
        console.error('Error pushing the image:', err);
        return reject(err);
      }

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) {
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
        } else {
          console.log('[img.push] onProgress', event);
          if (event.aux) {
            pushedImageResult = event.aux;
          }
        }
      }
    });
  });
}
