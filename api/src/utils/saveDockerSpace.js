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
        dockerhubImageToSconify,
        countImage,
        imageName,
        countContainers,
      },
      'Origin docker image cleaned successfully'
    );
  } catch (error) {
    logger.error(
      { imageName: dockerhubImageToSconify, error },
      `Error removing docker image, container and volumes`
    );
  }

  // Clean sconified image now that it has been pushed to dockerhub
  if (sconifiedImage) {
    try {
      await removeDockerImageWithVolumes({ imageName: sconifiedImage });
      logger.info(
        {
          sconifiedImage,
        },
        'Target docker image cleaned successfully'
      );
    } catch (error) {
      logger.error(
        { imageName: sconifiedImage, error },
        `Error removing docker image, container and volumes`
      );
    }
  }

  // Clean container used to sconify
  try {
    await removeDockerImageWithVolumes({
      imageName: SCONIFY_IMAGE,
      shouldRemoveImage: false,
    });
    logger.info(
      {
        sconifiedImage,
      },
      'Sconify docker container cleaned successfully'
    );
  } catch (err) {}
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
  logger.info(
    {
      countContainers: containers.length,
    },
    'Containers to be cleaned from local docker'
  );

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
    console.log(`Removed Docker container: ${containerInfo.Id}`);

    // Removing volumes
    const containerInfoFull = await container.inspect();
    const volumes = containerInfoFull.Mounts.map((mount) => mount.Name);
    const volumePromises = volumes.map(async (volumeName) => {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      console.log(`Removed Docker volume: ${volumeName}`);
    });
    await Promise.all(volumePromises);
  });

  await Promise.all(promises);
}
