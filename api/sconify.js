import Docker from "dockerode";
import "dotenv/config";

const SCONE_IMAGE =
  "registry.scontain.com/sconecuratedimages/node:14.4.0-alpine3.11";

const registryAuth = {
  username: process.env.REGISTRY_USERNAME,
  password: process.env.REGISTRY_PASSWORD,
  serveraddress: process.env.REGISTRY_SERVERADDRESS,
};
const docker = new Docker();

// Function to sconify the docker image
export function sconify({ dockerImageToSconify }) {
  console.log("Pulling Scone image...");

  docker.pull(
    SCONE_IMAGE,
    { authconfig: registryAuth },
    function (err, stream) {
      if (err) {
        console.error("Error pulling the image:", err);
        return;
      }

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) {
          console.error("Error in image pulling process:", err);
          return;
        }
        console.log("Scone image pulled successfully.");
        // Add your additional logic here, e.g., sconify the dockerImageToSconify
      }

      function onProgress(event) {
        console.log(event.status);
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
    }
  );

  // docker.pull('cedric25/my-idapp:0.2.0-debug', function (err, stream) {
  //   // streaming output from pull...
  //   console.log('err', err)
  //   console.log(stream)
  //
  //   docker.run('cedric25/my-idapp:0.2.0-debug', ['Cedric'], process.stdout, function (err, data, container) {
  //     console.log(data.StatusCode);
  //   });
  // });

  return Promise.resolve(true);
}
