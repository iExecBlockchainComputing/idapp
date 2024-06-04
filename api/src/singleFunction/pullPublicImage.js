import Docker from 'dockerode';

const docker = new Docker();

export function pullPublicImage(image) {
  console.log(`Pulling image: ${image}...`);

  return new Promise((resolve, reject) => {
    docker.pull(image, function (err, stream) {
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
        resolve();
      }

      function onProgress(event) {
        console.log(event);
      }
    });
  });
}
