import Docker from 'dockerode';
import { logger } from '../utils/logger.js';
import { inspectImage } from './inspectImage.js';
import { pullSconeImage } from './pullSconeImage.js';

const docker = new Docker();

export async function sconifyImage({ fromImage, toImage, imageName }) {
  logger.info({ fromImage, toImage, imageName }, 'Running sconify command...');

  const sconeImage = 'scone-production/iexec-sconify-image:5.7.6-v15';
  logger.info({ sconeImage }, 'Pulling scone image...');
  await pullSconeImage(`registry.scontain.com/${sconeImage}`);

  const sconifyContainer = await docker.createContainer({
    // https://gitlab.scontain.com/scone-production/iexec-sconify-image/container_registry/99?after=NTA
    Image: `registry.scontain.com/${sconeImage}`,
    Cmd: [
      'sconify_iexec',
      `--name=${imageName}`,
      `--from=${fromImage}`,
      `--to=${toImage}`,
      '--binary-fs',
      '--fs-dir=/app',
      '--host-path=/etc/hosts',
      '--host-path=/etc/resolv.conf',
      '--binary=/usr/local/bin/node',
      '--heap=1G',
      '--dlopen=1',
      '--no-color',
      '--verbose',
      '--command=node /app/src/app.js',
    ],
    HostConfig: {
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
      AutoRemove: true,
    },
  });

  await sconifyContainer.start();

  sconifyContainer.attach(
    { stream: true, stdout: true, stderr: true },
    function (err, stream) {
      if (err) {
        console.error('Error attaching to container:', err);
        return;
      }

      // 1- Stream everything to stdout
      // stream.pipe(process.stdout);

      // Or 2- Try to detect any 'docker build' error, otherwise log to stdout
      stream.on('data', function (data) {
        const readableData = data.toString('utf8');
        if (readableData.toLowerCase().includes('error')) {
          throw new Error('Failed to sconify image:', readableData);
        }
        console.log(readableData);
      });
    }
  );

  await sconifyContainer.wait();

  // await sconifyContainer.remove({ force: true });
  // logger.info('Docker container cleaned');

  let builtImage;
  try {
    builtImage = await inspectImage(toImage);
    console.log('builtImage', builtImage);
  } catch (error) {
    logger.error({ error, expectedImage: toImage }, 'ERROR inspectImage');
    throw new Error('Error at sconify process');
  }
  if (!builtImage) {
    throw new Error('Error at sconify process');
  }

  logger.info({ toImage }, 'Successfully built TEE docker image');
}
