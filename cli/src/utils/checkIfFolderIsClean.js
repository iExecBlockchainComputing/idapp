import { mkdir } from 'node:fs/promises';
import { isFolderEmpty } from './isFolderEmpty.js';
import { fileExists } from './fileExists.js';

export async function checkIfFolderIsClean() {
  return await isFolderEmpty(process.cwd());
}

export async function createProjectFolder(folderName) {
  // Try to create "hello-world", "hello-world_2", etc. until it works
  let folderToCreate;
  let projectFolderSuffix = 1;
  do {
    folderToCreate =
      projectFolderSuffix === 1
        ? folderName
        : folderName + '_' + projectFolderSuffix;
    if (!(await fileExists(folderToCreate))) {
      await mkdir(folderToCreate);
      break;
    }
    projectFolderSuffix++;
    // eslint-disable-next-line no-constant-condition
  } while (true);

  process.chdir(folderToCreate);

  return folderToCreate;
}
