import { readdir } from 'node:fs/promises';

export async function isFolderEmpty(path) {
  const files = await readdir(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}
