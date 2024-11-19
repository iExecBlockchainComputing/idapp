import { deployAppContractToBellecour } from './singleFunction/deployAppContractToBellecour.js';
import { getSconifiedImageFingerprint } from './singleFunction/getSconifiedImageFingerprint.js';
import { pullPublicImage } from './singleFunction/pullPublicImage.js';
import { inspectImage } from './singleFunction/inspectImage.js';
import { pullSconeImage } from './singleFunction/pullSconeImage.js';
import { sconifyImage } from './singleFunction/sconifyImage.js';
import { tagImage } from './singleFunction/tagImage.js';
import { pushImage } from './singleFunction/pushImage.js';
import { parseImagePath } from './utils/parseImagePath.js';

/**
 * Examples of valid dockerImageToSconify:
 * "robiniexec/hello-world:1.0.0"
 *
 * This image needs to be publicly available on Docker Hub.
 * This image needs to be built for linux/amd64 platform. (Use buildx on MacOS)
 */
export async function sconify({
  dockerImageToSconify,
  userWalletPublicAddress,
}) {
  console.log('dockerImageToSconify', dockerImageToSconify);
  console.log('userWalletPublicAddress', userWalletPublicAddress);

  if (!dockerImageToSconify) {
    throw new Error('dockerImageToSconify is required');
  }

  if (!userWalletPublicAddress) {
    throw new Error('userWalletPublicAddress is required');
  }

  try {
    console.log(
      '\n\n---------- 1 ---------- Pulling Docker image to sconify...'
    );
    await pullPublicImage(dockerImageToSconify);
    console.log('Pulled.');

    console.log(
      '\n\n---------- 2 ---------- Inspecting Docker image to sconify...'
    );
    const inspectResult = await inspectImage(dockerImageToSconify);
    // console.log('inspectResult', inspectResult);
    if (
      inspectResult.Os !== 'linux' ||
      inspectResult.Architecture !== 'amd64'
    ) {
      throw new Error(
        'dockerImageToSconify needs to target linux/amd64 platform.'
      );
    }

    const { dockerUserName, imageName, imageTag } =
      parseImagePath(dockerImageToSconify);
    if (!dockerUserName || !imageName || !imageTag) {
      throw new Error(
        'Invalid dockerImageToSconify. Please provide something that looks like robiniexec/hello-world:1.0.0'
      );
    }

    const targetImageRepo = 'teamproduct';
    const targetImageName = imageName;
    const targetImageTag = `${imageTag}-tee-scone-debug`;
    const targetImagePath = `${targetImageRepo}/${dockerUserName}-${targetImageName}:${targetImageTag}`;
    console.log('targetImagePath', targetImagePath);

    // Pull the SCONE image
    // https://gitlab.scontain.com/sconecuratedimages/node/container_registry/20
    console.log('\n\n---------- 3 ---------- Pulling Scone image');
    const SCONE_IMAGE =
      'registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11';
    await pullSconeImage(SCONE_IMAGE);
    console.log('Pulled.');

    console.log('\n\n---------- 4 ---------- Start sconification...');
    console.log('dockerImageToSconify', dockerImageToSconify);
    await sconifyImage({
      fromImage: dockerImageToSconify,
      toImage: targetImagePath,
      imageName: `tee-scone-${dockerUserName}-${targetImageName}`,
    });
    console.log('Sconified.');

    console.log('\n\n---------- 5 ---------- Tagging...');
    await tagImage({
      targetImagePath,
      repo: targetImageRepo,
      tag: targetImageTag,
    });
    console.log('Tagged.');

    console.log('\n\n---------- 6 ---------- Pushing...');
    const { Digest: pushedDockerImageDigest } = await pushImage({
      targetImagePath,
      targetImageTag,
    });
    console.log('pushedDockerImageDigest', pushedDockerImageDigest);
    console.log('Pushed.');
    const imageOnlyChecksum = pushedDockerImageDigest.split(':')[1];
    console.log('imageOnlyChecksum', imageOnlyChecksum);

    console.log('\n\n---------- 7 ---------- Getting TEE image fingerprint...');
    const fingerprint = await getSconifiedImageFingerprint({
      targetImagePath,
    });
    console.log('fingerprint', fingerprint);

    console.log('\n\n---------- 8 ---------- Deploying app contract...');
    const { appContractAddress } = await deployAppContractToBellecour({
      userWalletPublicAddress,
      appName: `${dockerUserName}-${targetImageName}-${Date.now().toString()}`,
      dockerImagePath: targetImagePath,
      dockerImageDigest: imageOnlyChecksum,
      fingerprint,
    });
    console.log('Deployed.');

    console.log('All operations completed successfully.');
    return {
      sconifiedImage: targetImagePath,
      appContractAddress,
    };
  } catch (error) {
    console.error('An error occurred during the process:', error);
    throw error;
  }
}
