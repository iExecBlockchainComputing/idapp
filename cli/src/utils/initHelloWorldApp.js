import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copy } from './copy.js';
import {
  CONFIG_FILE,
  TEST_INPUT_DIR,
  TEST_OUTPUT_DIR,
  CACHE_DIR,
} from '../config/config.js';
import { debug } from '../utils/debug.js';

export async function initHelloWorldApp({
  projectName,
  useArgs = false,
  useProtectedData = false,
  useInputFile = false,
  useRequesterSecret = false,
  useAppSecret = false,
}) {
  try {
    // Copy template
    await copyChosenTemplateFiles({
      projectName,
      template: 'js',
      srcFile: 'src/app.js',
      useArgs,
      useProtectedData,
      useInputFile,
      useRequesterSecret,
      useAppSecret,
    });
    // Create other files
    await createConfigurationFiles({ projectName, useProtectedData });
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

async function createConfigurationFiles({ projectName, useProtectedData }) {
  // Create a simple iApp configuration file
  const configContent = {
    projectName: projectName,
    dockerhubUsername: '',
    useProtectedData: useProtectedData,
  };
  await fs.writeFile(
    CONFIG_FILE,
    JSON.stringify(configContent, null, 2),
    'utf8'
  );
}

async function copyChosenTemplateFiles({
  projectName,
  template,
  srcFile,
  useArgs,
  useProtectedData,
  useInputFile,
  useRequesterSecret,
  useAppSecret,
}) {
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
  await Promise.all(
    files.filter((file) => file !== 'package.json').map((file) => write(file))
  );

  // transform template: remove unwanted feature code inside " // <feature> ... // </feature>" tags
  const code = (await fs.readFile(srcFile)).toString('utf8');
  let modifiedCode = code;
  if (!useArgs) {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<args>>\n((.*)\n)*? *\/\/ <<\/args>>\n/g,
      ''
    );
  } else {
    modifiedCode = modifiedCode.replaceAll(/ *\/\/ <<(\/)?args>>\n/g, '');
  }
  if (!useProtectedData) {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<protectedData>>\n((.*)\n)*? *\/\/ <<\/protectedData>>\n/g,
      ''
    );
  } else {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<(\/)?protectedData>>\n/g,
      ''
    );
  }
  if (!useInputFile) {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<inputFile>>\n((.*)\n)*? *\/\/ <<\/inputFile>>\n/g,
      ''
    );
  } else {
    modifiedCode = modifiedCode.replaceAll(/ *\/\/ <<(\/)?inputFile>>\n/g, '');
  }
  if (!useRequesterSecret) {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<requesterSecret>>\n((.*)\n)*? *\/\/ <<\/requesterSecret>>\n/g,
      ''
    );
  } else {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<(\/)?requesterSecret>>\n/g,
      ''
    );
  }
  if (!useAppSecret) {
    modifiedCode = modifiedCode.replaceAll(
      / *\/\/ <<appSecret>>\n((.*)\n)*? *\/\/ <<\/appSecret>>\n/g,
      ''
    );
  } else {
    modifiedCode = modifiedCode.replaceAll(/ *\/\/ <<(\/)?appSecret>>\n/g, '');
  }
  await fs.writeFile(srcFile, modifiedCode);

  // package json special treatment for name
  const pkg = JSON.parse(
    await fs.readFile(path.join(templateDir, `package.json`), 'utf8')
  );
  pkg.name = projectName;
  await write('package.json', JSON.stringify(pkg, null, 2) + '\n');

  // copy common README
  const readmePath = path.resolve(templatesBaseDir, 'common/README.md');
  await copy(readmePath, path.join(process.cwd(), 'README.md'));
}
