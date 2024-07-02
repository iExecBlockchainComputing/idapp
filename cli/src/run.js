import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { IExec, utils } from 'iexec';
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

  // Is valid iDapp Address
  if (!ethers.isAddress(iDappAddress)) {
    console.log(
      chalk.red(
        'The iDapp address is invalid. Be careful ENS name is not implemented yet ...'
      )
    );
    return;
  }

  let protectedDataAddress;
  if (argv.protectedData) {
    protectedDataAddress = argv.protectedData;
    // Is valid ProtectedData Address
    if (!ethers.isAddress(protectedDataAddress)) {
      console.log(
        chalk.red(
          'The protectedData address is invalid. Be careful ENS name is not implemented yet ...'
        )
      );
      return;
    }
  }

  // Get wallet from privateKey
  const wallet = await privateKeyManagement();

  const iexec = new IExec(
    {
      ethProvider: utils.getSignerFromPrivateKey(
        'bellecour',
        wallet.privateKey
      ),
    },
    {
      smsURL: 'https://sms.scone-debug.v8-bellecour.iex.ec',
    }
  );

  // Make some ProtectedData preflight check
  if (protectedDataAddress) {
    try {
      // Check the protectedData has its privateKey registered into the debug sms
      console.log(protectedDataAddress);
      const isSecretSet = await iexec.dataset.checkDatasetSecretExists(
        protectedDataAddress,
        {
          teeFramework: 'scone',
        }
      );

      if (!isSecretSet) {
        console.log(
          chalk.red(
            `Your protectedData secret key is not registered in the debug secret management service (SMS) of iexec protocol`
          )
        );
        return;
      }
    } catch (e) {
      console.log(
        chalk.red(
          `Error while running your iDapp with your protectedData: ${e.message}`
        )
      );
    }
  }

  // Workerpool Order
  let spinner = ora('Fetching workerpool order...').start();
  const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
    workerpool: WORKERPOOL_DEBUG,
    app: iDappAddress,
    dataset: protectedDataAddress || ethers.ZeroAddress,
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

  // App Order
  spinner = ora('Creating and publishing app order...').start();
  const apporderTemplate = await iexec.order.createApporder({
    app: iDappAddress,
    requesterrestrict: wallet.address,
    tag: SCONE_TAG,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  await iexec.order.publishApporder(apporder);
  spinner.succeed('AppOrder created and published');

  // Dataset Order
  let datasetorder;
  if (protectedDataAddress) {
    spinner = ora('Fetching protectedData access...').start();
    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      protectedDataAddress,
      {
        app: iDappAddress,
        workerpool: workerpoolorder.workerpool,
        requester: wallet.address,
        minTag: SCONE_TAG,
        maxTag: SCONE_TAG,
      }
    );
    datasetorder = datasetOrderbook.orders[0]?.order;
    if (!datasetorder) {
      spinner.fail('No matching ProtectedData access found');
      console.log(
        chalk.red(
          'It seems the protectedData is not allow to be consume by your iDapp, please grantAccess to it'
        )
      );
      return;
    }
    spinner.succeed('ProtectedData access found');
  }

  spinner = ora('Creating and publishing request order...').start();
  const requestorderToSign = await iexec.order.createRequestorder({
    app: iDappAddress,
    category: workerpoolorder.category,
    dataset: protectedDataAddress || ethers.ZeroAddress,
    appmaxprice: apporder.appprice,
    datasetmaxprice: datasetorder?.datasetprice || 0,
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
    datasetorder: protectedDataAddress ? datasetorder : undefined,
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
  console.log(
    chalk.green(
      `You can download the result of your task here: https://explorer.iex.ec/bellecour/task/${taskId}`
    )
  );
}

// TODO: Implement
export async function runInProd(argv) {
  console.log(
    chalk.red('This feature is not yet implemented. Coming soon ...')
  );
}
