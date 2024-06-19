#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './init.js';
import { deploy } from './deploy.js';
import { run } from './run.js';
import { sconify } from './sconify.js';
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
          describe: 'Test your idapp in real condition with docker',
          type: 'boolean',
          default: false,
        })
        .option('params', {
          describe: 'Parameters that will be accessible into the idapp',
          type: 'string',
          demandOption: false,
        });
    },
    test
  )

  // Build and publish docker image
  .command(
    'deploy',
    'Deploy your app',
    (yargs) => {
      return yargs
        .option('prod', {
          describe: 'Deploy idapp for production mode',
          type: 'boolean',
          default: false,
        })
        .option('debug', {
          describe: 'Deploy idapp in debug mode',
          type: 'boolean',
          default: false,
        });
    },
    deploy
  )

  // Sconify a dockerhub image
  .command('sconify', 'Sconify your app', () => {}, sconify)

  // Run a published docker image
  .command(
    'run <iDappAddress>',  // Define <iDappAddress> as a positional argument
    'Run your iDapp',
    (yargs) => {
      return yargs
        .positional('iDappAddress', {
          describe: 'The iDapp address to run',
          type: 'string',
        })
        .option('prod', {
          describe: 'Run idapp for production mode',
          type: 'boolean',
          default: false,
        })
        .option('debug', {
          describe: 'Run idapp in debug mode',
          type: 'boolean',
          default: false,
        });
    },
    run
  )

  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .parse();
