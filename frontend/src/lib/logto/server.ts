import { createLogtoAdapter } from '@logto/next/server';
import { serverLogtoConfig } from './config';

export const {
  handlers: logtoHandlers,
  withLogto,
  getLogtoContext,
  getLogtoUser,
} = createLogtoAdapter(serverLogtoConfig);
