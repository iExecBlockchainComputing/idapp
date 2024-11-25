export const handleCliError = ({ spinner, error }) => {
  const shouldBreakLine = !spinner.text.endsWith('\n');
  spinner.fail(spinner.text + (shouldBreakLine ? '\n' : '') + `    ${error}`);
  process.exit(1);
};
