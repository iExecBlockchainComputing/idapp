import inquirer from 'inquirer';
import { mkdir } from 'node:fs/promises';
import { isFolderEmpty } from './isFolderEmpty.js';
import { fileExists } from './fileExists.js';

export async function checkIfFolderIsClean() {
  if (await isFolderEmpty(process.cwd())) {
    return;
  }

  console.error('⚠️ Oops, current folder is not empty.');
  const folderName = 'hello-world';
  const { createHelloWorldFolder } = await inquirer.prompt({
    type: 'confirm',
    name: 'createHelloWorldFolder',
    message: `Want to run "mkdir ${folderName} && cd ${folderName}"?`,
  });
  if (!createHelloWorldFolder) {
    process.exit(1);
  }

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
  } while (true);

  process.chdir(folderToCreate);

  return folderToCreate;
}
