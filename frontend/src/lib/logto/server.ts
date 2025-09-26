import LogtoClient from '@logto/next/server-actions';
import {
  LOGTO_SESSION_COOKIE_NAME,
  LOGTO_SESSION_MAX_AGE_SECONDS,
  serverLogtoConfig,
} from './config';

export const logtoClient = new LogtoClient({
  endpoint: serverLogtoConfig.endpoint ?? '',
  appId: serverLogtoConfig.appId ?? '',
  appSecret: serverLogtoConfig.appSecret ?? '',
  baseUrl: serverLogtoConfig.baseUrl ?? '',
  scopes: serverLogtoConfig.scopes,
  cookieSecret: serverLogtoConfig.cookieSecret,
  cookieSecure: serverLogtoConfig.cookieSecure,
});

export const LOGTO_COOKIE_NAME = LOGTO_SESSION_COOKIE_NAME;
export const LOGTO_COOKIE_MAX_AGE = LOGTO_SESSION_MAX_AGE_SECONDS;
