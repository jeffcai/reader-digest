const DEFAULT_SCOPES = ['openid', 'profile', 'email'] as const;

const parseScopes = (value?: string | null) =>
  value?.split(/\s+/).filter(Boolean) ?? [...DEFAULT_SCOPES];

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
};

export interface LogtoServerConfig {
  endpoint?: string;
  appId?: string;
  appSecret?: string;
  baseUrl?: string;
  scopes: string[];
  cookieSecret: string;
  cookieSecure: boolean;
}

export const serverLogtoConfig: LogtoServerConfig = {
  endpoint: process.env.LOGTO_ENDPOINT ?? undefined,
  appId: process.env.LOGTO_APP_ID ?? undefined,
  appSecret: process.env.LOGTO_APP_SECRET ?? undefined,
  baseUrl: process.env.LOGTO_BASE_URL ?? undefined,
  scopes: parseScopes(process.env.LOGTO_SCOPES),
  cookieSecret: process.env.LOGTO_COOKIE_SECRET ?? 'development-only-logto-cookie-secret',
  cookieSecure: parseBoolean(
    process.env.LOGTO_COOKIE_SECURE,
    process.env.NODE_ENV === 'production',
  ),
};

export const clientLogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ?? '',
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID ?? '',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
};

export const LOGTO_SESSION_COOKIE_NAME = serverLogtoConfig.appId
  ? `logto:${serverLogtoConfig.appId}`
  : undefined;

export const LOGTO_SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;
