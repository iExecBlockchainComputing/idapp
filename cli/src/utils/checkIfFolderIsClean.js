import inquirer from 'inquirer';
import fs from 'node:fs';
import { isFolderEmpty } from './isFolderEmpty.js';

export async function checkIfFolderIsClean() {
  if (await isFolderEmpty(process.cwd())) {
    return;
  }

  console.error('⚠️ Folder is not empty.');
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
    if (!fs.existsSync(folderToCreate)) {
      fs.mkdirSync(folderToCreate);
      break;
    }
    projectFolderSuffix++;
  } while (true);

  process.chdir(folderToCreate);

  return folderToCreate;
}
