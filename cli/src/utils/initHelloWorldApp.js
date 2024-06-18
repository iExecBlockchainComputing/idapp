import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'util';
import { copy } from './copy.js';

const writeFileAsync = util.promisify(fs.writeFile);
const accessAsync = util.promisify(fs.access);

export async function initHelloWorldApp({
  projectName,
  hasProtectedData,
  template,
}) {
  try {
    if (hasProtectedData) {
      copyChosenTemplateFiles({
        projectName,
        template: `withProtectedData/${template}`,
      });
    } else {
      copyChosenTemplateFiles({
        projectName,
        template: `withoutProtectedData/${template}`,
      });
    }

    // Create idapp.config.json
    await createConfigurationFiles({ hasProtectedData });
  } catch (err) {
    console.log('Error during project initialization:', err);
    throw err;
  }
}

async function createConfigurationFiles({ hasProtectedData }) {
  console.log('hasProtectedData', hasProtectedData);
  // Create a simple iDapp configuration file
  const configContent = `{
  "dockerhubUsername": "",
  "withProtectedData": ${hasProtectedData}
}
`;

  await writeFileAsync('./idapp.config.json', configContent, 'utf8');
}

function copyChosenTemplateFiles({ projectName, template }) {
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../..',
    `templates/${template}`
  );

  const write = (file, content) => {
    const targetPath = path.join(process.cwd(), file);
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
