import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'util';
import { copy } from './copy.js';

const writeFileAsync = util.promisify(fs.writeFile);
const accessAsync = util.promisify(fs.access);

export async function initHelloWorldApp({
  targetDir,
  projectName,
  hasProtectedData,
  template,
}) {
  try {
    if (hasProtectedData) {
      copyChosenTemplateFiles({
        targetDir,
        projectName,
        template: `withProtectedData/${template}`,
      });
    } else {
      copyChosenTemplateFiles({
        targetDir,
        projectName,
        template: `withoutProtectedData/${template}`,
      });
    }

    // Create idapp.config.json
    await createConfigurationFiles({ targetDir, hasProtectedData });
  } catch (err) {
    console.log('Error during project initialization:', err);
    throw err;
  }
}

function copyChosenTemplateFiles({ targetDir, projectName, template }) {
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../..',
    `templates/${template}`
  );

  const write = (file, content) => {
    const targetPath = path.join(targetDir, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8')
  );

  pkg.name = projectName;

  write('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

async function createConfigurationFiles({ targetDir, hasProtectedData }) {
  // Create a simple iDapp configuration file
  const configContent = `{
  "dockerhubUsername": "",
  "withProtectedData": ${hasProtectedData}
}
`;

  const targetPath = path.join(targetDir, './idapp.config.json');
  await writeFileAsync(targetPath, configContent, 'utf8');
}
