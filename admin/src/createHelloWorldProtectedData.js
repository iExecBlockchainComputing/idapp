import { getWeb3Provider, IExecDataProtectorCore } from '@iexec/dataprotector';

/**
 * node --env-file=.env src/createHelloWorldProtectedData.js
 *
 * Done on Nov. 26th, 2024
 * Protected Data address: 0x3FFb9D62b527b32230DFf094D24A661495aDb0B4
 */

const DEBUG_SMS_URL = 'https://sms.scone-debug.v8-bellecour.iex.ec';

async function run() {
  const helloWorldWalletPrivateKey =
    process.env.HELLO_WORLD_PROTECTED_DATA_OWNER_PRIVATE_KEY;
  if (!helloWorldWalletPrivateKey) {
    throw new Error(
      'Oops, missing env var: HELLO_WORLD_PROTECTED_DATA_OWNER_PRIVATE_KEY'
    );
  }

  const provider = getWeb3Provider(helloWorldWalletPrivateKey);

  const iexecOptions = {
    smsURL: DEBUG_SMS_URL,
  };

  const dataProtectorOptions = {
    iexecOptions,
  };

  const dataProtectorCore = new IExecDataProtectorCore(
    provider,
    dataProtectorOptions
  );

  const createdProtectedData = await dataProtectorCore.protectData({
    name: 'Protected data for Hello World',
    data: {
      name: 'and welcome to iExec!',
    },
  });

  return createdProtectedData;
}

run()
  .then((res) => console.log('res', res))
  .catch((err) => console.log('err', err));
