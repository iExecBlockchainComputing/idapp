import Docker from 'dockerode';

const docker = new Docker();

export async function sconifyImage({ fromImage, toImage, imageName }) {
  console.log('Running sconify command...');
  console.log('fromImage', fromImage);
  console.log('toImage', toImage);
  console.log('imageName', imageName);

  const sconifyContainer = await docker.createContainer({
    // https://gitlab.scontain.com/scone-production/iexec-sconify-image/container_registry/99?after=NTA
    Image:
      // 'registry.scontain.com/scone-production/iexec-sconify-image:5.7.6-v15',
      'registry.scontain.com/scone-production/iexec-sconify-image:5.8.8-v15',
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
      '--command=node /app/app.js',
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
        if (readableData.includes('Error')) {
          throw new Error('Failed to sconify image:', readableData);
        }
        console.log(readableData);
      });
    }
  );

  await sconifyContainer.wait();
  console.log(`Successfully built TEE docker image => ${toImage}`);
}
