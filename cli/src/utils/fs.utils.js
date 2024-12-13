import { access, copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export async function fileExists(path) {
  return !!(await stat(path).catch(() => false));
}

export async function folderExists(folderPath) {
  try {
    await access(folderPath);
    return true;
  } catch {
    return false;
  }
}

export async function isFolderEmpty(path) {
  const files = await readdir(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
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

export async function copy(src, dest) {
  const stats = await stat(src);
  if (stats.isDirectory()) {
    await copyDir(src, dest);
  } else {
    await copyFile(src, dest);
  }
}

async function copyDir(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const files = await readdir(srcDir);
  await Promise.all(
    files.map((file) => {
      const srcFile = path.resolve(srcDir, file);
      const destFile = path.resolve(destDir, file);
      return copy(srcFile, destFile);
    })
  );
}
