#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './cmd/init.js';
import { deploy } from './cmd/deploy.js';
import { run } from './cmd/run.js';
import { test } from './cmd/test.js';

// define common options
const options = {
  args: [
    'args',
    {
      describe: `Arguments that will be accessible into the iApp. Spaces separates arguments, use quotes to group arguments (Ex: --args '"foo bar" baz' will interpret "foo bar" as first arg, "bar" as second arg)`,
      type: 'string',
      demandOption: false,
    },
  ],
  protectedData: [
    'protectedData',
    {
      describe: 'Specify the protected data address',
      type: 'string',
      default: null, // Set default to null or undefined to make it optional
    },
  ],
  inputFile: [
    'inputFile',
    {
      describe: 'Specify one or multiple input files (publicly-accessible URLs)',
      type: 'string',
      requiresArg: true, // must be invoked with a value
    },
  ],
};

yargs(hideBin(process.argv))
  .scriptName('iapp')
  .usage('$0 <cmd> [args]')

  // Initialize command
  .command('init', 'Initialize your app structure', () => {}, init)

  // Test command
  .command(
    'test',
    'Test your app',
    (yargs) => {
      return yargs
        .option(...options.args)
        .option(...options.inputFile)
        .array(options.inputFile[0]);
    },
    test
  )

  // Build and publish docker image
  .command(
    'deploy',
    'Transform you app into a TEE app and deploy it on iExec',
    deploy
  )

  // Run a published docker image
  .command(
    'run <iAppAddress>',
    'Run your iApp',
    (yargs) => {
      return yargs
        .positional('iAppAddress', {
          describe: 'The iApp address to run',
          type: 'string',
        })
        .option(...options.args)
        .option(...options.protectedData)
        .option(...options.inputFile)
        .array(options.inputFile[0]);
    },
    run
  )

  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .parse();
