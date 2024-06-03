import Docker from 'dockerode';

const docker = new Docker();

export async function tagImage({ targetImage, repo, tag }) {
  return new Promise((resolve, reject) => {
    docker.getImage(targetImage).tag({ repo, tag }, (err, data) => {
      if (err) {
        console.error('Error tagging the image:', err);
        return reject(err);
      }
      console.log(`Image tagged as ${targetImage}`);
      resolve(data);
    });
  });
}
