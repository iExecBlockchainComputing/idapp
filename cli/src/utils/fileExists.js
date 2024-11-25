import { stat } from 'node:fs/promises';

export async function fileExists(path) {
  return !!(await stat(path).catch(() => false));
}
