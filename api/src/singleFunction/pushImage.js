import Docker from 'dockerode';

const docker = new Docker();

const registryAuth = {
  username: process.env.REGISTRY_USERNAME,
  password: process.env.REGISTRY_PASSWORD,
  serveraddress: process.env.REGISTRY_SERVERADDRESS,
};

export async function pushImage(image) {
  console.log(`Pushing image: ${image} to DockerHub...`);

  return new Promise((resolve, reject) => {
    const img = docker.getImage(image);
    img.push(
      { authconfig: registryAuth, tag: '1.0.0-debug-tee-scone' },
      function (err, stream) {
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
          console.log(`Successfully pushed the image to DockerHub => ${image}`);
          console.log('output', output);
          resolve(output);
        }

        function onProgress(event) {
          if (event.error) {
            console.error('[img.push] onProgress ERROR', event.error);
          } else {
            console.log('[img.push] onProgress', event);
          }
        }
      }
    );
  });
}
