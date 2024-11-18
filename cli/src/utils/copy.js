import fs from 'node:fs/promises';
import path from 'node:path';

export async function copy(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await copyDir(src, dest);
  } else {
    await fs.copyFile(src, dest);
  }
}

async function copyDir(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const files = await fs.readdir(srcDir);
  await Promise.all(
    files.map((file) => {
      const srcFile = path.resolve(srcDir, file);
      const destFile = path.resolve(destDir, file);
      return copy(srcFile, destFile);
    })
  );
}
