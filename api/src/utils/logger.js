import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { pinoHttp } from 'pino-http';
import { session } from './requestContext.js';

export const logger = pino({
  mixin() {
    return {
      requestId: session.get('requestId'),
    };
  },
});

export function configureLogger(app, session) {
  app.use(
    pinoHttp({
      logger,
      genReqId: () => uuidv4(),
    })
  );

  app.use((req, res, next) => {
    session.run(() => {
      session.set('requestId', req.id);
      next();
    });
  });
}
