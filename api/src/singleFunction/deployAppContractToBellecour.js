import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExec, IExecConfig } from 'iexec';

/**
 * @returns {Promise<{appContractAddress: string, transferAppTxHash: string }>}
 */
export async function deployAppContractToBellecour({
  userWalletPublicAddress,
  appName,
  dockerImagePath,
  dockerImageDigest,
}) {
  const privateKey = Wallet.createRandom().privateKey;
  console.log('privateKey', privateKey);
  const config = new IExecConfig({
    ethProvider: getSignerFromPrivateKey('bellecour', privateKey),
  });
  const iexec = IExec.fromConfig(config);
  const { signer } = await iexec.config.resolveContractsClient();
  const randomWalletPublicAddress = await signer.getAddress();
  console.log('randomWalletPublicAddress', randomWalletPublicAddress);
  console.log('appName', appName);
  console.log('multiaddr', dockerImagePath);
  console.log('checksum', `0x${dockerImageDigest}`);
  const { address } = await iexec.app.deployApp({
    owner: randomWalletPublicAddress,
    name: appName,
    type: 'DOCKER',
    multiaddr: dockerImagePath,
    checksum: `0x${dockerImageDigest}`,
  });
  console.log('app contract deployed at', address);

  const { txHash } = await iexec.app.transferApp(
    address,
    userWalletPublicAddress
  );
  console.log('transferApp txHash', txHash);

  return {
    appContractAddress: address,
    transferAppTxHash: txHash,
  };
}
