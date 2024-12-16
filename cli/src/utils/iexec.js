import { IExec, utils } from 'iexec';

/**
 * @param {string} privateKey
 * @returns {IExec}
 */
export function getIExecDebug(privateKey) {
  return new IExec(
    {
      ethProvider: utils.getSignerFromPrivateKey('bellecour', privateKey),
    },
    {
      smsURL: 'https://sms.scone-debug.v8-bellecour.iex.ec',
    }
  );
}
