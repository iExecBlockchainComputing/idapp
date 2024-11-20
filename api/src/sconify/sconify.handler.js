import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { removeDockerImageWithVolumes } from '../utils/saveDockerSpace.js';
import { sconify } from './sconify.service.js';

const bodySchema = z.object({
  yourWalletPublicAddress: z.string().min(1, 'A wallet address is required'),
  dockerhubImageToSconify: z
    .string()
    .min(
      1,
      'A dockerhub image is required. <dockerhubUsername>/<iDappName>:<version>'
    ),
});

export async function sconifyHandler(req, res) {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      error:
        'Expecting a request body with `yourWalletPublicAddress` and `dockerhubImageToSconify`',
    });
  }

  let yourWalletPublicAddress;
  let dockerhubImageToSconify;

  try {
    const requestBody = bodySchema.parse(req.body);
    yourWalletPublicAddress = requestBody.yourWalletPublicAddress;
    dockerhubImageToSconify = requestBody.dockerhubImageToSconify;
  } catch (error) {
    logger.error(error);

    return res.status(400).json({
      success: false,
      error: error.errors,
    });
  }

  try {
    const { sconifiedImage, appContractAddress } = await sconify({
      dockerImageToSconify: dockerhubImageToSconify,
      userWalletPublicAddress: yourWalletPublicAddress,
    });

    res.status(200).json({
      success: true,
      sconifiedImage,
      appContractAddress,
    });

    // Clean user's docker image
    removeDockerImageWithVolumes(dockerhubImageToSconify)
      .then((removeResult) => {
        logger.info(
          {
            dockerhubImageToSconify,
            ...removeResult,
          },
          'Origin docker image cleaned successfully'
        );
      })
      .catch((error) => {
        logger.error(
          { imageName: dockerhubImageToSconify, error },
          `Error removing docker image, container and volumes`
        );
      });

    // Clean sconified image now that it has been pushed to dockerhub
    removeDockerImageWithVolumes(sconifiedImage).then(() => {
      logger.info(
        {
          sconifiedImage,
        },
        'Target docker image cleaned successfully'
      );
    });
  } catch (error) {
    logger.error(error);

    res.status(500).json({ success: false, error: error.message });

    // Clean user's docker image
    removeDockerImageWithVolumes(dockerhubImageToSconify)
      .then((removeResult) => {
        logger.info(
          {
            dockerhubImageToSconify,
            ...removeResult,
          },
          'Origin docker image cleaned successfully'
        );
      })
      .catch((error) => {
        logger.error(
          { imageName: dockerhubImageToSconify, error },
          `Error removing docker image, container and volumes`
        );
      });
  }
}
