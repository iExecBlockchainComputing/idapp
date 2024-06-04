import Docker from 'dockerode';

const docker = new Docker();

export async function tagImage({ targetImagePath, repo, tag }) {
  return new Promise((resolve, reject) => {
    docker.getImage(targetImagePath).tag({ repo, tag }, (err, data) => {
      if (err) {
        console.error('Error tagging the image:', err);
        return reject(err);
      }
      console.log(`Image tagged as ${targetImagePath}`);
      resolve(data);
    });
  });
}
