#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './init.js';
import { deploy } from './deploy.js';
import { run } from './run.js';
import { test } from './test.js';

yargs(hideBin(process.argv))
  .scriptName('idapp')
  .usage('$0 <cmd> [args]')

  // Initialize command
  .command('init', 'Initialize your app structure', () => {}, init)

  // Test command
  .command(
    'test',
    'Test your app',
    (yargs) => {
      return yargs
        .option('docker', {
          describe: 'Test your iDapp in real condition with docker',
          type: 'boolean',
          default: false,
        })
        .option('params', {
          describe: 'Parameters that will be accessible into the iDapp',
          type: 'string',
          demandOption: false,
        });
    },
    test
  )

  // Build and publish docker image
  .command(
    'deploy',
    'Deploy your non-tee or tee iDapp',
    (yargs) => {
      return yargs
        .option('prod', {
          describe: 'Deploy iDapp for production mode',
          type: 'boolean',
          default: false,
        })
        .option('debug', {
          describe: 'Deploy iDapp for debug mode',
          type: 'boolean',
          default: false,
        });
    },
    deploy
  )

  // Run a published docker image
  .command(
    'run <iDappAddress>', // Define <iDappAddress> as a require positional argument
    'Run your iDapp',
    (yargs) => {
      return yargs
        .positional('iDappAddress', {
          describe: 'The iDapp address to run',
          type: 'string',
        })
        .option('prod', {
          describe: 'Run iDapp in production mode (soon)',
          type: 'boolean',
          default: false,
        })
        .option('debug', {
          describe: 'Run iDapp in debug mode',
          type: 'boolean',
          default: false,
        })
        .option('protectedData', {
          describe: 'Specify the protected data address',
          type: 'string',
          default: null, // Set default to null or undefined to make it optional
        });
    },
    run
  )

  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .parse();
