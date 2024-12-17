import { debug } from './debug.js';

// spec reference https://distribution.github.io/distribution/spec/api/

/**
 * get an access token to perform operations on a repository of the docker hub registry
 *
 * @param { Object } params
 * @param { string } params.repository docker repository name
 * @param { string } params.action docker action scope (ex "pull", "push")
 * @param { string } params.dockerhubUsername docker hub username (must have specified "action" access to repository)
 * @param { string } params.dockerhubAccessToken docker hub access token (must have specified "action" access to repository)
 * @returns { string } token
 */
async function getAccessToken({
  repository,
  action = 'pull',
  dockerhubUsername,
  dockerhubAccessToken,
}) {
  const response = await fetch(
    `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:${action}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${dockerhubUsername}:${dockerhubAccessToken}`).toString('base64')}`,
      },
    }
  );
  if (!response.ok) {
    throw Error(`Fail to get access token for scope=${repository}:${action}`);
  }
  const { token } = await response.json();
  return token;
}

/**
 * Get a docker image manifest from docker hub registry
 *
 * @param { Object } params
 * @param { string } params.repository docker image repository name
 * @param { string } params.tag docker image tag
 * @param { string } params.dockerhubUsername docker hub username (must have read access to repository)
 * @param { string } params.dockerhubAccessToken docker hub access token (must have read access to repository)
 * @returns { Object } json manifest (application/vnd.docker.distribution.manifest.v2+json)
 */
async function getImageManifest({
  repository,
  tag,
  dockerhubUsername,
  dockerhubAccessToken,
}) {
  try {
    const pullToken = await getAccessToken({
      repository,
      // action: 'pull',
      action: 'pull,push',
      dockerhubUsername,
      dockerhubAccessToken,
    });

    const response = await fetch(
      `https://registry-1.docker.io/v2/${repository}/manifests/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${pullToken}`,
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      }
    );
    if (!response.ok) {
      const message = await response
        .json()
        .then(JSON.stringify)
        .catch(() => '');
      throw Error(
        `registry-1.docker.io answered with HTTP ${response.status} ${message}`
      );
    }
    const manifest = await response.json();
    return manifest; // Manifest JSON
  } catch (error) {
    throw Error(`Failed to get ${repository}:${tag} image manifest`, {
      cause: error,
    });
  }
}

/**
 * Set a docker image manifest
 *
 * @param { Object } params
 * @param { string } params.repository docker image repository name
 * @param { string } params.tag docker image tag
 * @param { Object } params.manifest docker image manifest (application/vnd.docker.distribution.manifest.v2+json)
 * @param { string } params.dockerhubUsername docker hub username (must have write access to repository)
 * @param { string } params.dockerhubAccessToken docker hub access token (must have write access to repository)
 */
async function setImageManifest({
  repository,
  tag,
  manifest,
  dockerhubUsername,
  dockerhubAccessToken,
}) {
  try {
    const pushToken = await getAccessToken({
      repository,
      action: 'pull,push',
      dockerhubUsername,
      dockerhubAccessToken,
    });

    const response = await fetch(
      `https://registry-1.docker.io/v2/${repository}/manifests/${tag}`,
      {
        method: 'PUT',
        body: JSON.stringify(manifest),
        headers: {
          Authorization: `Bearer ${pushToken}`,
          'Content-Type':
            'application/vnd.docker.distribution.manifest.v2+json',
        },
      }
    );
    if (!response.ok) {
      const message = await response
        .json()
        .then(JSON.stringify)
        .catch(() => '');
      throw Error(
        `registry-1.docker.io answered with HTTP ${response.status} ${message}`
      );
    }
  } catch (error) {
    throw Error(`Failed to set ${repository}:${tag} image manifest`, {
      cause: error,
    });
  }
}

/**
 * Copy missing blobs from sourceRepository to targetRepository
 *
 * @param { Object } params
 * @param { string } params.sourceRepository docker hub repository to copy blobs from
 * @param { string } params.targetRepository docker hub repository to copy blobs to
 * @param { Object } params.manifest docker source image manifest (application/vnd.docker.distribution.manifest.v2+json)
 * @param { string } params.dockerhubUsername docker hub username (must have read access to sourceRepository an write access to targetRepository)
 * @param { string } params.dockerhubAccessToken docker hub access token (must have read access to sourceRepository an write access to targetRepository)
 */
async function copyBlobs({
  sourceRepository,
  targetRepository,
  manifest,
  dockerhubUsername,
  dockerhubAccessToken,
}) {
  const [pushToken, pullToken] = await Promise.all([
    getAccessToken({
      repository: targetRepository,
      action: 'pull,push',
      dockerhubUsername,
      dockerhubAccessToken,
    }),
    getAccessToken({
      repository: sourceRepository,
      action: 'pull',
      dockerhubUsername,
      dockerhubAccessToken,
    }),
  ]);

  const ensureBlobCopied = async ({ digest }) => {
    const blobExistsResponse = await fetch(
      `https://registry-1.docker.io/v2/${targetRepository}/blobs/${digest}`,
      {
        method: 'HEAD',
        headers: {
          Authorization: `Bearer ${pushToken}`,
        },
      }
    );
    if (blobExistsResponse.status === 200) {
      debug(`blob ${digest} already exists`);
      return;
    }
    // get blob from source repo
    const pullBlobResponse = await fetch(
      `https://registry-1.docker.io/v2/${sourceRepository}/blobs/${digest}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${pullToken}`,
          Accept: 'application/octet-stream',
        },
      }
    );
    if (!pullBlobResponse.ok) {
      throw Error(
        `Failed to get blob ${digest} from ${sourceRepository} (HTTP ${pullBlobResponse.status})`
      );
    }

    // get upload url to target repo
    const requestUploadResponse = await fetch(
      `https://registry-1.docker.io/v2/${targetRepository}/blobs/uploads/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pushToken}`,
        },
      }
    );
    if (!requestUploadResponse.ok) {
      throw Error(
        `Failed to get blob upload url for ${targetRepository} (HTTP ${requestUploadResponse.status})`
      );
    }
    const uploadUrl = requestUploadResponse.headers.get('Location');
    const uploadResponse = await fetch(`${uploadUrl}&digest=${digest}`, {
      method: 'PUT',
      body: pullBlobResponse.body,
      duplex: 'half',
      headers: {
        Authorization: `Bearer ${pushToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': pullBlobResponse.headers.get('Content-Length'),
      },
    });
    if (!uploadResponse.ok) {
      throw Error(
        `Failed to upload blob ${digest} to ${targetRepository} (HTTP ${uploadResponse.status})`
      );
    }
    debug(`blob ${digest} upload response ${uploadResponse.status}`);
  };

  await Promise.all([
    ensureBlobCopied({ digest: manifest.config.digest }), // config blob
    ...manifest.layers.map(({ digest }) => ensureBlobCopied({ digest })), // layers blob
  ]);
}

/**
 * Copy an image from a repository to another in the docker hub registry
 *
 * @param { Object } params
 * @param { string } params.sourceRepository docker hub repository to copy image from
 * @param { string } params.targetRepository docker hub repository to copy image to
 * @param { string } params.sourceTag image tag for source
 * @param { string } params.targetTag image tag for target
 * @param { string } params.dockerhubUsername docker hub username (must have read access to sourceRepository an write access to targetRepository)
 * @param { string } params.dockerhubAccessToken docker hub access token (must have read access to sourceRepository an write access to targetRepository)
 */
export async function copyDockerHubImage({
  sourceRepository,
  sourceTag,
  targetRepository,
  targetTag,
  dockerhubUsername,
  dockerhubAccessToken,
}) {
  try {
    const manifest = await getImageManifest({
      repository: sourceRepository,
      tag: sourceTag,
      dockerhubUsername,
      dockerhubAccessToken,
    });
    await copyBlobs({
      sourceRepository,
      targetRepository,
      manifest,
      dockerhubUsername,
      dockerhubAccessToken,
    });
    await setImageManifest({
      repository: targetRepository,
      tag: targetTag,
      manifest,
      dockerhubUsername,
      dockerhubAccessToken,
    }).catch();
  } catch (error) {
    throw Error(
      `Failed to copy docker image ${sourceRepository}:${sourceTag} to ${targetRepository}:${targetTag}`,
      { cause: error }
    );
  }
}
