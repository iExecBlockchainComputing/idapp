import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

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
