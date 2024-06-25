import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { IExec, utils } from 'iexec';
import { readIDappConfig } from './utils/fs.js';
import { privateKeyManagement } from './utils/privateKeyManagement.js';
import { SCONE_TAG, WORKERPOOL_DEBUG } from './config/config.js';
import { addRunData } from './utils/cacheExecutions.js';

export async function run(argv) {
  let mode;
  if (!argv.prod && !argv.debug) {
    const modeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Would you like to run your idapp for prod or debug?',
        choices: ['Debug', 'Prod'],
        default: 0, // Default to 'Debug'
      },
    ]);
    mode = modeAnswer.mode;
  }
  if (argv.debug || mode === 'Debug') {
    await runInDebug(argv);
  } else {
    runInProd(argv);
  }
}

export async function runInDebug(argv) {
  const iDappAddress = argv.iDappAddress;

  if (!ethers.isAddress(iDappAddress)) {
    console.log(
      chalk.red(
        'The iDapp address is invalid. Be careful ENS name is not implemented yet ...'
      )
    );
    return;
  }

  let withProtectedData;
  try {
    const config = readIDappConfig();
    withProtectedData = config.withProtectedData;
  } catch (err) {
    console.log('err', err);
    return;
  }

  // Get wallet from privateKey
  const wallet = await privateKeyManagement();

  const iexecOptions = {
    smsURL: 'https://sms.scone-debug.v8-bellecour.iex.ec',
  };

  const iexec = new IExec(
    {
      ethProvider: utils.getSignerFromPrivateKey(
        'bellecour',
        wallet.privateKey
      ),
    },
    {
      iexecOptions: iexecOptions,
    }
  );

  let spinner = ora('Fetching workerpool order...').start();
  const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
    workerpool: WORKERPOOL_DEBUG,
    app: iDappAddress,
    // dataset: vProtectedData,
    minTag: SCONE_TAG,
    maxTag: SCONE_TAG,
  });
  const workerpoolorder = workerpoolOrderbook.orders[0]?.order;
  if (!workerpoolorder) {
    spinner.fail('No WorkerpoolOrder found');
    console.log(chalk.red('Wait until some workerpoolOrder come back'));
    return;
  }
  spinner.succeed('Workerpool order fetched');

  spinner = ora('Creating and publishing app order...').start();
  const apporderTemplate = await iexec.order.createApporder({
    app: iDappAddress,
    requesterrestrict: wallet.address,
    tag: SCONE_TAG,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  await iexec.order.publishApporder(apporder);
  spinner.succeed('AppOrder created and published');

  spinner = ora('Creating and publishing request order...').start();
  const requestorderToSign = await iexec.order.createRequestorder({
    app: iDappAddress,
    category: workerpoolorder.category,
    // dataset: vProtectedData,
    appmaxprice: apporder.appprice,
    // datasetmaxprice: datasetorder.datasetprice,
    workerpoolmaxprice: workerpoolorder.workerpoolprice,
    tag: SCONE_TAG,
    workerpool: workerpoolorder.workerpool,
    // params: {
    //   iexec_args: vArgs,
    // },
  });
  const requestorder = await iexec.order.signRequestorder(requestorderToSign);
  spinner.succeed('RequestOrder created and published');

  spinner = ora('Matching orders...').start();
  const { dealid, txHash } = await iexec.order.matchOrders({
    apporder,
    workerpoolorder,
    requestorder,
  });
  addRunData({ iDappAddress, dealid, txHash });
  spinner.succeed(`Deal created successfully, this is your deal ID: ${dealid}`);

  spinner = ora('Observing task...').start();
  const taskId = await iexec.deal.computeTaskId(dealid, 0);
  const taskObservable = await iexec.task.obsTask(taskId, { dealid: dealid });
  await new Promise((resolve, reject) => {
    taskObservable.subscribe({
      next: () => {},
      error: (e) => {
        reject(e);
      },
      complete: () => resolve(undefined),
    });
  });

  spinner.succeed('Task finalized');
  spinner.stop();
}

// TODO: Implement
export async function runInProd(argv) {
  console.log(
    chalk.red('This feature is not yet implemented. Coming soon ...')
  );
}
