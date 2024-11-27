import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import {
  checkIfFolderIsClean,
  createProjectFolder,
} from '../utils/checkIfFolderIsClean.js';
import { initHelloWorldApp } from '../utils/initHelloWorldApp.js';
import { isValidPackageName } from '../utils/isValidPackageName.js';
import { getSpinner } from '../cli-helpers/spinner.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';

export async function init() {
  const spinner = getSpinner();
  try {
    spinner.start('Configuring project...');
    spinner.log(
      chalk.magenta(
        figlet.textSync('IDAPP', {
          font: 'Standard',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        })
      )
    );
    const continueAnswer = await spinner.prompt({
      type: 'confirm',
      name: 'continue',
      message:
        'A new project will be created in the current directory. Do you want to continue?',
    });
    if (!continueAnswer.continue) {
      process.exit(1);
    }

    let folderCreated;
    if (!(await checkIfFolderIsClean())) {
      const folderName = 'hello-world';
      const { createHelloWorldFolder } = await spinner.prompt({
        type: 'confirm',
        name: 'createHelloWorldFolder',
        message: `Want to run "mkdir ${folderName} && cd ${folderName}"?`,
      });
      if (!createHelloWorldFolder) {
        process.exit(1);
      }
      folderCreated = await createProjectFolder(folderName);
    }

    const currentFolderName = process.cwd().split('/').pop();
    const { projectName } = await spinner.prompt({
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: currentFolderName,
    });

    if (!isValidPackageName(projectName)) {
      spinner.fail('Invalid package.json name');
      process.exit(1);
    }

    const { hasProtectedData } = await spinner.prompt({
      type: 'confirm',
      name: 'hasProtectedData',
      message: 'Would you like to access a protected data inside your iDapp?',
      default: false,
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
      hasProtectedData,
      template: 'javascript',
    });
    spinner.succeed('JavaScript app setup complete.');

    const output = `
  ${chalk.bold.underline('Steps to Get Started:')}
  
    Navigate to your project folder:
    ${chalk.yellow(`$ cd ${folderCreated || '.'}`)}
  
    ${chalk.green('Make your changes in the')} ${chalk.cyan('src/app.js')} ${chalk.green('file')}.
  
    -1- Test your idapp locally:
    ${chalk.yellow('$ idapp test')}
    ${chalk.yellow('$ idapp test --args your-name')}
  
    -2- Deploy your idapp on the iExec protocol:
    ${chalk.yellow('$ idapp deploy')}
  
    -3- Ask an iExec worker to run your confidential idapp:
    ${chalk.yellow('$ idapp run <my-idapp-address>')}
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
