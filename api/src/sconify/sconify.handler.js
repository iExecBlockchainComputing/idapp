import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { cleanLocalDocker } from '../utils/saveDockerSpace.js';
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

    cleanLocalDocker({
      dockerhubImageToSconify,
      sconifiedImage,
    }).then(() => {
      logger.info('Local docker cleaned');
    });
  } catch (error) {
    logger.error(error);

    res.status(500).json({ success: false, error: error.message });

    cleanLocalDocker({
      dockerhubImageToSconify,
    }).then(() => {
      logger.info('Local docker cleaned');
    });
  }
}
