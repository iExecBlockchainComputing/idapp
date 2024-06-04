// import util from 'node:util';
import Docker from 'dockerode';

const docker = new Docker();

export function inspectImage(image) {
  return new Promise((resolve, reject) => {
    docker.getImage(image).inspect((err, data) => {
      if (err) {
        console.error('Error inspecting the image:', err);
        return reject(err);
      }
      // console.log('Image inspected:', util.inspect(data, false, null, true));
      resolve(data);
    });
  });
}
