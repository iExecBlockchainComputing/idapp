import util from 'node:util';
import Docker from 'dockerode';
import { pullImage } from './singleFunction/pullImage.js';
import { sconifyImage } from './singleFunction/sconifyImage.js';
import { tagImage } from './singleFunction/tagImage.js';
import { pushImage } from './singleFunction/pushImage.js';

const docker = new Docker();

export async function sconify({ dockerImageToSconify }) {
  const SCONE_IMAGE =
    'registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11';
  const targetImageRepo = 'teamproduct/hello-world';
  const targetImageTag = '1.0.0-debug-tee-scone';
  const targetImage = `${targetImageRepo}:${targetImageTag}`;
  console.log('targetImage', targetImage);

  try {
    // await new Promise((resolve, reject) => {
    //   docker.listImages({}, function (err, res) {
    //     console.log('err', err);
    //     console.log('res', res);
    //     resolve();
    //   });
    // });
    // return;

    // Pull the SCONE image
    console.log('--- 1 --- pulling...');
    await pullImage(SCONE_IMAGE);
    console.log('Pulled.');

    // Pull the SCONE image
    console.log('--- 1 --- pulling...');
    await pullImage(
      'registry.scontain.com/scone-production/iexec-sconify-image:5.7.6-v15'
    );
    console.log('Pulled.');

    // Sconify Image
    console.log('\n--- 2 --- Start sconification...');
    await sconifyImage({
      fromImage: dockerImageToSconify,
      toImage: targetImage,
    });
    console.log('Sconified.');

    console.log('\n--- 3 --- Tagging...');
    await tagImage({
      targetImage,
      repo: targetImageRepo,
      tag: targetImageTag,
    });
    console.log('Tagged.');

    // Check if the image is tagged
    // await new Promise((resolve, reject) => {
    //   docker.getImage(targetImage).inspect((err, data) => {
    //     if (err) {
    //       console.error('Error inspecting the image:', err);
    //       return reject(err);
    //     }
    //     console.log('Image inspected:', util.inspect(data, false, null, true));
    //     resolve(data);
    //   });
    // });

    console.log('\n--- 4 --- Pushing...');
    await pushImage(targetImage);
    console.log('Pushed.');

    console.log('All operations completed successfully.');
    return targetImage;
  } catch (error) {
    console.error('An error occurred during the process:', error);
    throw error;
  }
}
