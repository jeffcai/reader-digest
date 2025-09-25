import type { LogtoConfig } from '@logto/next';

export const serverLogtoConfig: LogtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
  baseUrl: process.env.LOGTO_BASE_URL,
  scopes: process.env.LOGTO_SCOPES?.split(' ') ?? ['openid', 'profile', 'email'],
};

export const clientLogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
};
