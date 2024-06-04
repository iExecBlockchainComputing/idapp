import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExec, IExecConfig } from 'iexec';

export async function deployAppContractToBellecour({
  userWalletPublicAddress,
  appName,
  dockerImagePath,
}) {
  const privateKey = Wallet.createRandom().privateKey;
  const config = new IExecConfig({
    ethProvider: getSignerFromPrivateKey('mainnet', privateKey),
  });
  const iexec = IExec.fromConfig(config);
  const { address } = await iexec.app.deployApp({
    owner: userWalletPublicAddress,
    name: appName,
    type: 'DOCKER',
    multiaddr: `registry.hub.docker.com/${dockerImagePath}`,
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
  });
  console.log('deployed at', address);
}
