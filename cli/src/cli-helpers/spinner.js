import ora from 'ora';
import prompts from 'prompts';
import { onCancelPrompt } from '../utils/onCancelPrompt.js';

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

  const prompt = async (oneQuestion) => {
    const { isSpinning } = spinner;
    if (isSpinning) {
      spinner.stop();
    }
    const res = await prompts(oneQuestion, {
      onCancel: () => onCancelPrompt(spinner),
    });
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
     * prompt using `prompts` without disrupting the spinner
     */
    prompt,
  });
};
