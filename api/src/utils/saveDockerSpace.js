import Docker from 'dockerode';
import { logger } from './logger.js';

const docker = new Docker();

export async function removeDockerImageWithVolumes(imageName) {
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
