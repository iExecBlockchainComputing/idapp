import ora from 'ora';
import inquirer from 'inquirer';

export const getSpinner = () => {
  const spinner = ora();

  const log = (msg) => {
    const { isSpinning } = spinner;
    if (isSpinning) {
      spinner.stop();
    }
    // eslint-disable-next-line no-console
    console.log(msg);
    if (isSpinning) {
      spinner.start();
    }
  };
  const newLine = () => log('');
  const prompt = async (...args) => {
    const { isSpinning } = spinner;
    if (isSpinning) {
      spinner.stop();
    }
    const res = await inquirer.prompt(...args);
    if (isSpinning) {
      spinner.start();
    }
    return res;
  };

  return Object.assign(spinner, {
    /*
     * log message without disrupting the spinner
     */
    log,
    /**
     * create new line without disrupting the spinner
     */
    newLine,
    /**
     * prompt using inquirer without disrupting the spinner
     */
    prompt,
  });
};
