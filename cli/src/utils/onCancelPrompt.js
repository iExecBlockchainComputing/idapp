export function onCancelPrompt(spinner) {
  spinner?.fail('Operation cancelled');
  process.exit(0);
}
