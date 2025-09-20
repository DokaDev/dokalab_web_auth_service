import { RequestContext } from '../auth/request-context';

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}