import ora from 'ora';

export const getSpinner = () => {
  const spinner = ora();
  // log message without disrupting the spinner
  spinner.log = (msg) => {
    const { isSpinning } = spinner;
    if (isSpinning) {
      spinner.stop();
    }
    console.log(msg);
    if (isSpinning) {
      spinner.start();
    }
  };
  // create new line without disrupting the spinner
  spinner.newLine = () => spinner.log('');
  return spinner;
};
