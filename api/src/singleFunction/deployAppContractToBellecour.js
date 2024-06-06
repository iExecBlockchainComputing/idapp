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
  const config = new IExecConfig({
    ethProvider: getSignerFromPrivateKey('mainnet', privateKey),
  });
  const iexec = IExec.fromConfig(config);
  const { signer } = await iexec.config.resolveContractsClient();
  const randomWalletPublicAddress = await signer.getAddress();
  const { address } = await iexec.app.deployApp({
    owner: randomWalletPublicAddress,
    name: appName,
    type: 'DOCKER',
    multiaddr: `registry.hub.docker.com/${dockerImagePath}`,
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
