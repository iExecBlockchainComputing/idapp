import Docker from 'dockerode';
import { SCONIFY_IMAGE } from '../constants/constants.js';
import { logger } from './logger.js';

const docker = new Docker();

export async function cleanLocalDocker({
  dockerhubImageToSconify,
  sconifiedImage,
}) {
  // Clean user's docker image
  try {
    const { countImage, imageName, countContainers } =
      await removeDockerImageWithVolumes({
        imageName: dockerhubImageToSconify,
      });
    logger.info(
      {
        userBaseImage: dockerhubImageToSconify,
        countImage,
        imageName,
        countContainers,
      },
      "[docker cleaning] User's base image cleaned successfully"
    );
  } catch (error) {
    logger.error(
      { imageName: dockerhubImageToSconify, error },
      `[docker cleaning] Error removing user\'s base image`
    );
  }

  // Clean sconified image now that it has been pushed to dockerhub
  if (sconifiedImage) {
    try {
      const { countImage, imageName, countContainers } =
        await removeDockerImageWithVolumes({ imageName: sconifiedImage });
      logger.info(
        {
          sconifiedImage,
          countImage,
          imageName,
          countContainers,
        },
        '[docker cleaning] Sconified image cleaned successfully'
      );
    } catch (error) {
      logger.error(
        { imageName: sconifiedImage, error },
        `[docker cleaning] Error removing sconified image`
      );
    }
  }

  // Clean container used to sconify
  try {
    const { countContainers } = await removeDockerImageWithVolumes({
      imageName: SCONIFY_IMAGE,
      shouldRemoveImage: false,
    });
    logger.info(
      {
        containerForImage: SCONIFY_IMAGE,
        countContainers,
      },
      '[docker cleaning] Sconify container cleaned successfully'
    );
  } catch (error) {
    logger.error(
      { containersBasedOnImage: SCONIFY_IMAGE, error },
      `[docker cleaning] Error removing sconify container`
    );
  }
}

async function removeDockerImageWithVolumes({
  imageName,
  shouldRemoveImage = true,
}) {
  // Get all containers based on this image
  const containers = await docker.listContainers({
    all: true,
    filters: { ancestor: [imageName] },
  });

  await removeContainersAndVolumes(containers);

  if (!shouldRemoveImage) {
    return {
      countContainers: containers.length,
    };
  }

  // Remove the image itself
  const image = docker.getImage(imageName);
  await image.remove({ force: true });

  return {
    countImage: 1,
    imageName,
    countContainers: containers.length,
  };
}

async function removeContainersAndVolumes(containers) {
  const promises = containers.map(async (containerInfo) => {
    const container = docker.getContainer(containerInfo.Id);
    await container.remove({ force: true });

    // Removing volumes
    const containerInfoFull = await container.inspect();
    const volumes = containerInfoFull.Mounts.map((mount) => mount.Name);
    const volumePromises = volumes.map(async (volumeName) => {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
    });
    await Promise.all(volumePromises);
  });

  await Promise.all(promises);
}
