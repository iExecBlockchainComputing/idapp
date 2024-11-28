import Docker from 'dockerode';

const docker = new Docker();

export async function getSconifiedImageFingerprint({ targetImagePath }) {
  const container = await docker.createContainer({
    Image: targetImagePath,
    Cmd: [],
    HostConfig: {
      AutoRemove: false, // do not auto remove, we want to collect log after the container is exited
    },
    Env: ['SCONE_HASH=1'],
  });
  await container.start();
  // wait for the container to exit
  await container.wait();
  // get logs
  const stdoutBuffer = await container.logs({ stdout: true });
  // remove container now
  await container.remove();
  const fingerprint = stdoutBuffer.toString('utf8').trim();
  console.log('fingerprint', fingerprint);
  if (!fingerprint) {
    throw new Error('No fingerprint found');
  }
  return fingerprint;
}
