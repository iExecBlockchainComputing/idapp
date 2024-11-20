import 'dotenv/config';
import express from 'express';
import { readFile } from 'fs/promises';
import pino from 'pino';
import { sconifyHandler } from './sconify/sconify.handler.js';
import { configureLogger } from './utils/logger.js';
import { session } from './utils/requestContext.js';

const app = express();
const hostname = '0.0.0.0';
const port = 3000;

const rootLogger = pino();

// Read package.json to get the version
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

configureLogger(app, session);

app.use(express.json());

app.post('/sconify', sconifyHandler);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    version: packageJson.version,
    status: 'up',
  });
});

app.get('/', (req, res) => {
  res.status(200).send('Hello from idapp-sconifier-api 👋');
});

app.listen(port, hostname, () => {
  rootLogger.info(`Server running at http://${hostname}:${port}/`);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
});

process.on('exit', (exitCode) => {
  logger.info({ exitCode }, 'Exit');
});
