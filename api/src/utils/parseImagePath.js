export function parseImagePath(dockerImagePath) {
  const dockerUserName = dockerImagePath.split('/')[0];
  const nameWithTag = dockerImagePath.split('/')[1];
  const imageName = nameWithTag.split(':')[0];
  const imageTag = nameWithTag.split(':')[1] || 'latest';
  return { dockerUserName, imageName, imageTag };
}
