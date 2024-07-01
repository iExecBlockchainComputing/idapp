import Docker from 'dockerode';

const docker = new Docker();

// Fonction pour supprimer une image Docker avec ses volumes associés
export const removeImageWithVolumes = async (imageName) => {
  try {
    // Récupérer tous les conteneurs qui utilisent cette image
    const containers = await docker.listContainers({
      all: true,
      filters: { ancestor: [imageName] },
    });

    // Supprimer les conteneurs associés et leurs volumes
    const removeContainersAndVolumes = async () => {
      const promises = containers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);
        await container.remove({ force: true });
        console.log(`Removed Docker container: ${containerInfo.Id}`);

        // Supprimer les volumes associés au conteneur
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
    };

    // Appeler la suppression des conteneurs et volumes associés
    await removeContainersAndVolumes();

    // Maintenant supprimer l'image elle-même
    const image = docker.getImage(imageName);
    await image.remove({ force: true });
    console.log(`Removed Docker image: ${imageName}`);
  } catch (err) {
    console.error(
      `Error removing Docker image ${imageName} with volumes:`,
      err
    );
  }
};
