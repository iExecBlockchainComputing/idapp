import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import { checkIfFolderIsClean } from './utils/checkIfFolderIsClean.js';
import { initHelloWorldApp } from './utils/initHelloWorldApp.js';
import { isValidPackageName } from './utils/isValidPackageName.js';

export async function init() {
  console.log(
    chalk.magenta(
      figlet.textSync('IDAPP', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );

  const continueAnswer = await inquirer.prompt({
    type: 'confirm',
    name: 'continue',
    message:
      'A new project will be created in the current directory. Do you want to continue?',
  });
  if (!continueAnswer.continue) {
    process.exit(0);
  }

  const folderCreated = await checkIfFolderIsClean();

  const currentFolderName = process.cwd().split('/').pop();
  const { projectName } = await inquirer.prompt({
    type: 'input',
    name: 'projectName',
    message: 'What is the name of your project?',
    default: currentFolderName,
  });

  if (!isValidPackageName(projectName)) {
    console.error('⚠️ Invalid package.json name');
    process.exit(1);
  }

  const { hasProtectedData } = await inquirer.prompt({
    type: 'confirm',
    name: 'hasProtectedData',
    message: 'Would you like to access a protected data inside your iDapp?',
    default: false,
  });

  console.log('-----');
  console.log(
    'ℹ️  LIMITATION: Your JavaScript code will be run in a Node.js v14.4 environment.'
  );
  console.log('-----');

  const spinner = ora('Initializing iexec framework ...').start();

  // Copying JavaScript simple project files from templates/
  let initSpinner;
  try {
    initSpinner = ora('Creating "Hello World" JavaScript app...').start();
    await initHelloWorldApp({
      projectName,
      hasProtectedData,
      template: 'javascript',
    });
    initSpinner.succeed('JavaScript app setup complete.');
  } catch (err) {
    initSpinner.fail(`An error occurred: ${err.message}`);
    spinner.stop();
    process.exit(1);
  }

  spinner.stop();

  const output = `
${chalk.bold.underline('Steps to Get Started:')}

  Navigate to your project folder:
  ${chalk.yellow(`$ cd ${folderCreated || '.'}`)}

  ${chalk.green('Make your changes in the')} ${chalk.cyan('src/app.js')} ${chalk.green('file')}.

  -1- Test your idapp locally:
  ${chalk.yellow('$ idapp test')}
  ${chalk.yellow('$ idapp test --params your-name')}
  ${chalk.yellow('$ idapp test --docker')}
  ${chalk.yellow('$ idapp test --docker --params your-name')}

  -2- Deploy your idapp on the iExec protocol:
  ${chalk.yellow('$ idapp deploy')}

  -3- Ask an iExec worker to run your confidential idapp:
  ${chalk.yellow('$ idapp run <my-idapp-address>')}
`;

  console.log(
    boxen(output, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );
}
