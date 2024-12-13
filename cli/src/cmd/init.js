import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import { createProjectFolder, folderExists } from '../utils/fs.utils.js';
import { initHelloWorldApp } from '../utils/initHelloWorldApp.js';
import { isValidPackageName } from '../utils/isValidPackageName.js';
import { getSpinner } from '../cli-helpers/spinner.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';

const targetDir = 'hello-world';

export async function init() {
  const spinner = getSpinner();
  try {
    spinner.start('Configuring project...');
    spinner.log(
      chalk.magenta(
        figlet.textSync('IAPP', {
          font: 'Standard',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        })
      )
    );

    const { projectName } = await spinner.prompt({
      type: 'text',
      name: 'projectName',
      message:
        "What's your project name? (A folder with this name will be created)",
      initial: targetDir,
    });

    if (await folderExists(projectName)) {
      spinner.fail(
        `Target directory "${targetDir}" already exists. Remove it or choose a different name.`
      );
      process.exit(1);
    }

    await createProjectFolder(projectName);

    let packageName;
    if (!isValidPackageName(projectName)) {
      const packageNameAnswer = await spinner.prompt({
        type: 'text',
        name: 'packageName',
        message: 'Package name:',
        initial: targetDir,
      });
      packageName = packageNameAnswer.packageName;
    } else {
      packageName = projectName;
    }

    const { hasProtectedData } = await spinner.prompt({
      type: 'confirm',
      name: 'hasProtectedData',
      message: 'Would you like to access a protected data inside your iApp?',
      initial: false,
    });

    spinner.log('-----');
    spinner.log(
      'ℹ️  LIMITATION: Your JavaScript code will be run in a Node.js v14.4 environment with npm v6.'
    );
    spinner.log('-----');

    // Copying JavaScript simple project files from templates/

    spinner.start('Creating "Hello World" JavaScript app...');
    await initHelloWorldApp({
      projectName,
      packageName,
      hasProtectedData,
      template: 'javascript',
    });
    spinner.succeed('JavaScript app setup complete.');

    const output = `
  ${chalk.bold.underline('Steps to Get Started:')}
  
    Navigate to your project folder:
    ${chalk.yellow(`$ cd ${projectName}`)}
  
    ${chalk.green('Make your changes in the')} ${chalk.cyan('src/app.js')} ${chalk.green('file')}.
  
    -1- Test your iApp locally:
    ${chalk.yellow('$ iapp test')}
    ${chalk.yellow('$ iapp test --args your-name')}
  
    -2- Deploy your iApp on the iExec protocol:
    ${chalk.yellow('$ iapp deploy')}
  
    -3- Ask an iExec worker to run your confidential iApp:
    ${chalk.yellow('$ iapp run <iapp-address>')}
  `;

    spinner.log(
      boxen(output, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      })
    );
  } catch (error) {
    handleCliError({ spinner, error });
  }
}
