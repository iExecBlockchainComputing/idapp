import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFIG_FILE,
  TEST_INPUT_DIR,
  TEST_OUTPUT_DIR,
  CACHE_DIR,
} from '../config/config.js';
import { debug } from './debug.js';
import { copy } from './fs.utils.js';

export async function initHelloWorldApp({
  projectName,
  hasProtectedData,
  template,
}) {
  try {
    // Copy template
    if (hasProtectedData) {
      await copyChosenTemplateFiles({
        template: `withProtectedData/${template}`,
      });
    } else {
      await copyChosenTemplateFiles({
        template: `withoutProtectedData/${template}`,
      });
    }

    // Create other files
    await createConfigurationFiles({ projectName, hasProtectedData });
    await createProjectDirectories();
  } catch (err) {
    debug('Error during project initialization:', err);
    throw err;
  }
}

async function createProjectDirectories() {
  await Promise.all([
    fs.mkdir(TEST_INPUT_DIR, { recursive: true }),
    fs.mkdir(TEST_OUTPUT_DIR, { recursive: true }),
    fs.mkdir(CACHE_DIR, { recursive: true }),
  ]);
}

async function createConfigurationFiles({ projectName, hasProtectedData }) {
  // Create a simple iApp configuration file
  const configContent = {
    projectName: projectName,
    dockerhubUsername: '',
    withProtectedData: hasProtectedData,
  };
  await fs.writeFile(
    CONFIG_FILE,
    JSON.stringify(configContent, null, 2),
    'utf8'
  );
}

async function copyChosenTemplateFiles({ template }) {
  const templatesBaseDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../..',
    'templates'
  );

  const write = async (file, content) => {
    const targetPath = path.join(process.cwd(), file);
    if (content) {
      await fs.writeFile(targetPath, content);
    } else {
      await copy(path.join(templateDir, file), targetPath);
    }
  };
  // copy selected template
  const templateDir = path.resolve(templatesBaseDir, template);
  const files = await fs.readdir(templateDir);
  await Promise.all(files.map((file) => write(file)));

  // copy common README
  const readmePath = path.resolve(templatesBaseDir, 'common/README.md');
  await copy(readmePath, path.join(process.cwd(), 'README.md'));
}
