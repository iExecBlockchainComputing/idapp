import { pullPublicImage } from './singleFunction/pullPublicImage.js';
import { inspectImage } from './singleFunction/inspectImage.js';
import { pullSconeImage } from './singleFunction/pullSconeImage.js';
import { sconifyImage } from './singleFunction/sconifyImage.js';
import { tagImage } from './singleFunction/tagImage.js';
import { pushImage } from './singleFunction/pushImage.js';

/**
 * Examples of valid dockerImageToSconify:
 * "robiniexec/hello-world:1.0.0"
 *
 * This image needs to be publicly available on Docker Hub.
 * This image needs to be built for linux/amd64 platform. (Use buildx on MacOS)
 */
export async function sconify({ dockerImageToSconify }) {
  console.log('dockerImageToSconify', dockerImageToSconify);

  if (!dockerImageToSconify) {
    throw new Error('dockerImageToSconify is required');
  }

  try {
    await pullPublicImage(dockerImageToSconify);

    // TODO Add some verification about image to sconify
    const inspectResult = await inspectImage(dockerImageToSconify);
    console.log('inspectResult', inspectResult);
    if (
      inspectResult.Os !== 'linux' ||
      inspectResult.Architecture !== 'amd64'
    ) {
      throw new Error(
        'dockerImageToSconify needs to target linux/amd64 platform.'
      );
    }

    const SCONE_IMAGE =
      'registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11';
    const targetImageRepo = 'teamproduct/hello-world';
    const targetImageTag = '1.0.0-debug-tee-scone';
    const targetImage = `${targetImageRepo}:${targetImageTag}`;
    console.log('targetImage', targetImage);

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
    await pullSconeImage(SCONE_IMAGE);
    console.log('Pulled.');

    // Pull the SCONE image
    // console.log('--- 1 --- pulling...');
    // await pullImage(
    //   'registry.scontain.com/scone-production/iexec-sconify-image:5.7.6-v15'
    // );
    // console.log('Pulled.');

    // Sconify Image
    console.log('\n--- 2 --- Start sconification...');
    console.log('dockerImageToSconify', dockerImageToSconify);
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
