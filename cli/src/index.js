#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './init.js';
import { deploy } from './deploy.js';
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
      return yargs.option('docker', {
        describe: 'Test your idapp in real condition with docker',
        type: 'boolean',
        default: false,
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
          describe: 'Deploy tests in debug mode',
          type: 'boolean',
          default: false,
        });
    },
    deploy
  )

  // Sconify a dockerhub image
  .command('sconify', 'Sconify your app', () => {}, sconify)

  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .parse();
