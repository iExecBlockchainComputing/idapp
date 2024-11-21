import { v4 as uuidv4 } from 'uuid';
import { session } from './requestContext.js';

export const requestIdMiddleware = (_req, _res, next) => {
  session.run(() => {
    const id = uuidv4();
    session.set('requestId', id);
    next();
  });
};

export const getRequestId = () => session.get('requestId');
