import { IExec, utils } from 'iexec';

/**
 * node --env-file=.env src/grantAccessToAnyUserAnyApp.js
 *
 * Done on Dec. 2nd, 2024
 * publishDatasetorder() orderHash: 0x4bd01e20022d0ac518eefeec1a25ea42a6393ab4aac9e8b4cd0944d179db29d5
 *
 * Check on Market API:
 * https://api.market.v8-bellecour.iex.ec/datasetorders?chainId=134&dataset=0x3FFb9D62b527b32230DFf094D24A661495aDb0B4&isDatasetStrict=true&minTag=0x0000000000000000000000000000000000000000000000000000000000000003&pageIndex=0&pageSize=20
 * -> count: 1
 */

const PROTECTED_DATA_ADDRESS = '0x3FFb9D62b527b32230DFf094D24A661495aDb0B4';
const DEBUG_SMS_URL = 'https://sms.scone-debug.v8-bellecour.iex.ec';

async function run() {
  const helloWorldWalletPrivateKey =
    process.env.HELLO_WORLD_PROTECTED_DATA_OWNER_PRIVATE_KEY;
  if (!helloWorldWalletPrivateKey) {
    throw new Error(
      'Oops, missing env var: HELLO_WORLD_PROTECTED_DATA_OWNER_PRIVATE_KEY'
    );
  }

  const iexec = new IExec(
    {
      ethProvider: utils.getSignerFromPrivateKey(
        'bellecour',
        helloWorldWalletPrivateKey
      ),
    },
    {
      smsURL: DEBUG_SMS_URL,
    }
  );

  const datasetorder = await iexec.order
    .createDatasetorder({
      dataset: PROTECTED_DATA_ADDRESS,
      apprestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      datasetprice: 0,
      volume: 10_000,
      tag: ['tee', 'scone'],
    })
    .then((datasetorderTemplate) =>
      iexec.order.signDatasetorder(datasetorderTemplate)
    )
    .catch((error) => {
      console.log('error', error);
      throw new Error('Failed to create or sign data access');
    });

  const orderHash = await iexec.order
    .publishDatasetorder(datasetorder)
    .catch((error) => {
      console.log('error', error);
      throw new Error('Failed to publish data access');
    });

  console.log('orderHash', orderHash);
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
