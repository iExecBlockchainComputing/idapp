import Docker from 'dockerode';

const SCONE_IMAGE = 'registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11'

const docker = new Docker();

export function sconify({
  dockerImageToSconify
}) {
  // Pull Scone image
  docker.pull(SCONE_IMAGE, function (err, stream) {
    console.log('err', err)
    if (err) {
      return
    }

    // console.log('-> docker.run')
    // docker.run(SCONE_IMAGE, [
    //   '-v /var/run/docker.sock:/var/run/docker.sock',
    //   'registry.scontain.com/scone-production/iexec-sconify-image:5.7.6-v15',
    //   'sconify_iexec',
    //   '--name=my-idapp-tee-scone',
    //   '--from=cedric25/my-idapp:0.2.0-debug',
    //   '--to=cedric25/my-idapp:0.2.0-debug-tee-scone',
    //   '--binary-fs',
    //   '--fs-dir=/app',
    //   '--host-path=/etc/hosts',
    //   '--host-path=/etc/resolv.conf',
    //   '--binary=/usr/local/bin/node',
    //   '--heap=1G',
    //   '--dlopen=1',
    //   '--no-color',
    //   '--verbose',
    //   '--command=node /app/app.js',
    // ], process.stdout, function (err, data, container) {
    //   console.log('data', data);
    // });
  })

  // docker.pull('cedric25/my-idapp:0.2.0-debug', function (err, stream) {
  //   // streaming output from pull...
  //   console.log('err', err)
  //   console.log(stream)
  //
  //   docker.run('cedric25/my-idapp:0.2.0-debug', ['Cedric'], process.stdout, function (err, data, container) {
  //     console.log(data.StatusCode);
  //   });
  // });

  return Promise.resolve(true)
}
