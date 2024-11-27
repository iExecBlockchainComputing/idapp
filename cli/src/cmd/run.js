import chalk from 'chalk';
import { ethers } from 'ethers';
import { IExec, utils } from 'iexec';
import { askForWalletPrivateKey } from '../cli-helpers/askForWalletPrivateKey.js';
import { SCONE_TAG, WORKERPOOL_DEBUG } from '../config/config.js';
import { addRunData } from '../utils/cacheExecutions.js';
import { getSpinner } from '../cli-helpers/spinner.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';

export async function run({ iDappAddress, args, protectedData }) {
  const spinner = getSpinner();
  try {
    await runInDebug({ iDappAddress, args, protectedData, spinner });
  } catch (error) {
    handleCliError({ spinner, error });
  }
}

export async function runInDebug({
  iDappAddress,
  args,
  protectedData,
  spinner,
}) {
  // Is valid iDapp Address
  if (!ethers.isAddress(iDappAddress)) {
    spinner.log(
      chalk.red(
        'The iDapp address is invalid. Be careful ENS name is not implemented yet ...'
      )
    );
    return;
  }

  if (protectedData) {
    // Is valid ProtectedData Address
    if (!ethers.isAddress(protectedData)) {
      spinner.log(
        chalk.red(
          'The protectedData address is invalid. Be careful ENS name is not implemented yet ...'
        )
      );
      return;
    }
  }

  // Get wallet from privateKey
  const walletPrivateKey = await askForWalletPrivateKey({ spinner });
  const wallet = new ethers.Wallet(walletPrivateKey);

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
  if (protectedData) {
    try {
      // Check the protectedData has its privateKey registered into the debug sms
      const isSecretSet = await iexec.dataset.checkDatasetSecretExists(
        protectedData,
        {
          teeFramework: 'scone',
        }
      );

      if (!isSecretSet) {
        spinner.log(
          chalk.red(
            `Your protectedData secret key is not registered in the debug secret management service (SMS) of iexec protocol`
          )
        );
        return;
      }
    } catch (e) {
      spinner.log(
        chalk.red(
          `Error while running your iDapp with your protectedData: ${e.message}`
        )
      );
    }
  }

  // Workerpool Order
  spinner.start('Fetching workerpool order...');
  const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
    workerpool: WORKERPOOL_DEBUG,
    app: iDappAddress,
    dataset: protectedData || ethers.ZeroAddress,
    minTag: SCONE_TAG,
    maxTag: SCONE_TAG,
  });
  const workerpoolorder = workerpoolOrderbook.orders[0]?.order;
  if (!workerpoolorder) {
    spinner.fail('No WorkerpoolOrder found');
    spinner.log(chalk.red('Wait until some workerpoolOrder come back'));
    return;
  }
  spinner.succeed('Workerpool order fetched');

  // App Order
  spinner.start('Creating and publishing app order...');
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
  if (protectedData) {
    spinner.start('Fetching protectedData access...');
    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      protectedData,
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
      spinner.log(
        chalk.red(
          'It seems the protectedData is not allow to be consume by your iDapp, please grantAccess to it'
        )
      );
      return;
    }
    spinner.succeed('ProtectedData access found');
  }

  spinner.start('Creating and publishing request order...');
  const requestorderToSign = await iexec.order.createRequestorder({
    app: iDappAddress,
    category: workerpoolorder.category,
    dataset: protectedData || ethers.ZeroAddress,
    appmaxprice: apporder.appprice,
    datasetmaxprice: datasetorder?.datasetprice || 0,
    workerpoolmaxprice: workerpoolorder.workerpoolprice,
    tag: SCONE_TAG,
    workerpool: workerpoolorder.workerpool,
    params: {
      iexec_args: args,
    },
  });
  const requestorder = await iexec.order.signRequestorder(requestorderToSign);
  spinner.succeed('RequestOrder created and published');

  spinner.start('Matching orders...');
  const { dealid, txHash } = await iexec.order.matchOrders({
    apporder,
    datasetorder: protectedData ? datasetorder : undefined,
    workerpoolorder,
    requestorder,
  });
  await addRunData({ iDappAddress, dealid, txHash });
  spinner.succeed(
    `Deal created successfully, this is your deal ID: https://explorer.iex.ec/bellecour/deal/${dealid}`
  );

  spinner.start('Observing task...');
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

  const task = await iexec.task.show(taskId);
  spinner.log(
    chalk.green(
      `You can download the result of your task here: https://ipfs-gateway.v8-bellecour.iex.ec${task?.results?.location}`
    )
  );
}
