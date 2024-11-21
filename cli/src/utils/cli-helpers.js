export const handleCliError = ({ spinner, error }) => {
  spinner.fail(spinner.text + `   -> ${error}`);
  process.exit(1);
};
