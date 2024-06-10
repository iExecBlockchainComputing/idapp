import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import { initFrameworkForJavascript } from './utils/initFramework.js';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

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

  const projectNameAnswer = await inquirer.prompt({
    type: 'input',
    name: 'projectName',
    message: 'What is the name of your project?',
    default: 'my-idapp',
  });

  const languageAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Which language do you want to use to build your iDapp?',
      choices: ['JavaScript', 'Typescript', 'Python', 'Rust', 'bash'],
      default: 0,
    },
  ]);

  const spinner = ora('Initializing iexec framework ...').start();

  try {
    // Initialize a new Node.js project
    if (languageAnswer.language === 'JavaScript') {
      const initSpinner = ora('Setting up JavaScript framework...').start();
      await initFrameworkForJavascript();
      initSpinner.succeed('JavaScript framework setup complete.');

      const packagePath = './package.json';
      const readSpinner = ora('Reading package.json...').start();
      const data = await readFile(packagePath, 'utf8');
      readSpinner.succeed('Read package.json.');

      const packageJson = JSON.parse(data);
      packageJson.name = projectNameAnswer.projectName;

      const writeSpinner = ora('Updating package.json...').start();
      await writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      writeSpinner.succeed('Updated package.json.');
    } else {
      console.log(
        chalk.red(`${languageAnswer.language} language is not supported yet`)
      );
    }
  } catch (error) {
    console.log(chalk.red(`An error occurred: ${error.message}`));
  } finally {
    spinner.stop();
  }
}
