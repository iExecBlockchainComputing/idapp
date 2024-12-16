import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IExecDataProtectorCore } from '@iexec/dataprotector';
import { AbstractSigner, JsonRpcProvider } from 'ethers';
import { getSpinner } from '../cli-helpers/spinner.js';
import { fileExists } from '../utils/fs.utils.js';
import { TEST_INPUT_DIR } from '../config/config.js';
import { handleCliError } from '../cli-helpers/handleCliError.js';

export async function mockProtectedData() {
  const spinner = getSpinner();

  try {
    async function buildData({ dataState = {}, dataSchema = {} } = {}) {
      // get data fragment key
      const { key } = await spinner.prompt({
        type: 'text',
        name: 'key',
        message:
          "What key do you want to use to store the piece of data? (use '.' to access nested keys)",
      });

      // check key is valid
      const keyPath = key.split('.');
      const ALLOWED_KEY_NAMES_REGEXP = /^[a-zA-Z0-9\-_]*$/;
      const keyFragmentErrors = keyPath
        .map((fragment) => {
          if (fragment === '') {
            return `Empty key fragment`;
          }
          if (!ALLOWED_KEY_NAMES_REGEXP.test(fragment)) {
            return `Unsupported special character in key`;
          }
        })
        .filter(Boolean);

      // get data fragment type
      if (keyFragmentErrors.length === 0) {
        const BOOLEAN = 'boolean';
        const NUMBER = 'number';
        const STRING = 'string';
        const FILE = 'file';

        const { type } = await spinner.prompt({
          type: 'select',
          name: 'type',
          message: `What kind of data is \`${key}\`?`,
          choices: [
            { title: BOOLEAN, value: BOOLEAN },
            { title: NUMBER, value: NUMBER },
            { title: STRING, value: STRING },
            { title: FILE, value: FILE },
            { title: `My bad, I don't want to add data at \`${key}\`` },
          ],
        });

        // get data fragment value
        let value;
        switch (type) {
          case BOOLEAN:
            {
              const res = await spinner.prompt([
                {
                  type: 'select',
                  name: 'value',
                  message: `What is the value of \`${key}\`?`,
                  choices: [
                    { title: 'true', value: true },
                    { title: 'false', value: false },
                  ],
                },
              ]);
              value = res.value;
            }
            break;
          case NUMBER:
            {
              const res = await spinner.prompt([
                {
                  type: 'text',
                  name: 'value',
                  message: `What is the value of \`${key}\`? (${NUMBER})`,
                },
              ]);
              const numValue = Number(res.value);
              if (!Number.isNaN(numValue)) {
                value = numValue;
              } else {
                spinner.warn('Invalid input, should be a number');
              }
            }
            break;
          case STRING:
            {
              const res = await spinner.prompt([
                {
                  type: 'text',
                  name: 'value',
                  message: `What is the value of \`${key}\`? (${STRING})`,
                },
              ]);
              value = res.value;
            }
            break;
          case FILE:
            {
              const { path } = await spinner.prompt([
                {
                  type: 'text',
                  name: 'path',
                  message: `Where is the file located? (path)`,
                },
              ]);
              const exists = await fileExists(path);
              if (exists) {
                const stats = await stat(path);
                if (stats.isFile()) {
                  const buffer = await readFile(path);
                  value = buffer;
                } else {
                  spinner.warn(
                    'Invalid path, the node at specified path is not a file'
                  );
                }
              } else {
                spinner.warn('Invalid path, no file at specified path');
              }
            }
            break;
          default:
            break;
        }

        // build data fragment
        if (value !== undefined) {
          const setNestedKeyValue = (obj, path, value) => {
            const [currentKey, ...nextPath] = path;
            if (nextPath.length === 0) {
              obj[currentKey] = value;
            } else {
              // create nested object if needed
              if (
                typeof obj[currentKey] !== 'object' || // key is not an object
                obj[currentKey].constructor.name !== 'Object' // key is a special object (file Buffer for example)
              ) {
                obj[currentKey] = {};
              }
              setNestedKeyValue(obj[currentKey], nextPath, value);
            }
          };
          setNestedKeyValue(dataState, keyPath, value);
          setNestedKeyValue(dataSchema, keyPath, type);
        }
      } else {
        spinner.warn(`Invalid key: ${keyFragmentErrors.join(', ')}`);
      }

      spinner.info(
        `This is how your protectedData looks so far:\n${JSON.stringify(dataSchema, null, 2)}`
      );

      const { addMore } = await spinner.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: `Would you add more data?`,
          default: true,
        },
      ]);
      if (addMore) {
        return buildData({ dataState, dataSchema });
      }
      return dataState;
    }
    spinner.info(
      'Answer a few questions to create your custom protectedData mock'
    );
    spinner.start('Building protectedData mock...');
    const data = await buildData();
    if (Object.keys(data).length === 0) {
      throw Error('Data is empty, creation aborted');
    }

    spinner.start(
      `Creating protectedData mock file in \`${TEST_INPUT_DIR}\` directory...`
    );
    const dp = new IExecDataProtectorCore(
      new AbstractSigner(new JsonRpcProvider('https://bellecour.iex.ec')), // signer not implemented
      { ipfsNode: 'http://fake.iex.ec' } // service does not exists, uploading will fail
    );
    let schema;
    let unencryptedData;
    await dp
      .protectData({
        data,
        onStatusUpdate: ({ title, isDone, payload }) => {
          if (title === 'CREATE_ZIP_FILE' && isDone) {
            unencryptedData = payload.zipFile; // TODO require @iexec/dataprotector changes to expose zipFile
          }
          if (title === 'EXTRACT_DATA_SCHEMA' && isDone) {
            schema = payload.schema; // TODO require @iexec/dataprotector changes to expose schema
          }
        },
      })
      .catch((e) => {
        // error is expected after schema extraction and unencrypted data serialization
        if (!unencryptedData || !schema) {
          throw Error(`Failed to serialize yous data: ${e.message}`);
        }
      });
    await mkdir(TEST_INPUT_DIR, { recursive: true });
    await writeFile(join(TEST_INPUT_DIR, 'protectedData.zip'), unencryptedData);
    spinner.succeed(
      `Mocked protectedData created in \`${TEST_INPUT_DIR}\` directory\nMocked protectedData schema is:\n${JSON.stringify(schema, null, 2)}`
    );
  } catch (error) {
    handleCliError({ spinner, error });
  }
}
