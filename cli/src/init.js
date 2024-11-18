import chalk from 'chalk';
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

  console.log(
    '\n You can now make your changes in the `src/app.js file` and then:'
  );
  console.log('');
  console.log(` $> cd ${folderCreated}`);
  console.log('');
  console.log(` 👉 Test you idapp locally:`);
  console.log(' $> idapp test');
  console.log(' $> idapp test --params your-name');
  console.log(' $> idapp test --docker');
  console.log(' $> idapp test --docker --params your-name');
  console.log('');
  console.log(` 👉 Deploy your idapp on the iExec protocol:`);
  console.log(' $> idapp deploy');
  console.log('');
  console.log(` 👉 Ask an iExec worker to run your confidential idapp:`);
  console.log(' $> idapp run <my-idapp-address>');
}
