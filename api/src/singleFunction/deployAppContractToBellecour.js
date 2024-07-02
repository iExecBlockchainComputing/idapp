import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExec, IExecConfig } from 'iexec';

/**
 * @returns {Promise<{appContractAddress: string}>}
 */
export async function deployAppContractToBellecour({
  userWalletPublicAddress,
  appName,
  dockerImagePath,
  dockerImageDigest,
  fingerprint,
}) {
  const privateKey = Wallet.createRandom().privateKey;
  const config = new IExecConfig({
    ethProvider: getSignerFromPrivateKey('bellecour', privateKey),
  });
  const iexec = IExec.fromConfig(config);
  const { address } = await iexec.app.deployApp({
    owner: userWalletPublicAddress,
    name: appName,
    type: 'DOCKER',
    multiaddr: dockerImagePath,
    checksum: `0x${dockerImageDigest}`,
    // Some code sample here: https://github.com/iExecBlockchainComputing/dataprotector-sdk/blob/v2/packages/protected-data-delivery-dapp/deployment/src/singleFunction/deployApp.ts
    mrenclave: {
      framework: 'SCONE',
      version: 'v5',
      entrypoint: 'node /app/src/app.js',
      heapSize: 1073741824,
      fingerprint,
    },
  });
  console.log('app contract deployed at', address);

  return {
    appContractAddress: address,
  };
}
