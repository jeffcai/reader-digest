import { NextRequest, NextResponse } from 'next/server';
import { logtoClient, LOGTO_COOKIE_MAX_AGE, LOGTO_COOKIE_NAME } from '@/lib/logto/server';
import { serverLogtoConfig } from '@/lib/logto/config';

const isDebug = process.env.NODE_ENV !== 'production';
const debugLog = (...args: unknown[]) => {
  if (isDebug) {
    console.log('[Logto]', ...args);
  }
};

debugLog('Server config', {
  endpoint: serverLogtoConfig.endpoint,
  appId: serverLogtoConfig.appId,
  baseUrl: serverLogtoConfig.baseUrl,
  cookieName: LOGTO_COOKIE_NAME,
  cookieSecure: serverLogtoConfig.cookieSecure,
  scopes: serverLogtoConfig.scopes,
});

// Accept: /api/auth/logto/<action>
//         /api/auth/logto/<action>?redirectTo=/foo
// This catch-all route resolves the last path segment as the action.

const resolveBaseUrl = (request: NextRequest) =>
  serverLogtoConfig.baseUrl && serverLogtoConfig.baseUrl.length > 0
    ? serverLogtoConfig.baseUrl
    : request.nextUrl.origin;

const buildCallbackUrl = (request: NextRequest) => {
  const baseUrl = resolveBaseUrl(request);
  // The URI sent to Logto must exactly match one of the URIs registered in the Logto admin console.
  const callbackUrl = new URL('/api/auth/logto/sign-in-callback', baseUrl);
  return callbackUrl.toString();
};

const applySessionCookie = (response: NextResponse, value?: string) => {
  if (!LOGTO_COOKIE_NAME) {
    return;
  }

  if (!value) {
    debugLog('Clearing session cookie');
    response.cookies.delete(LOGTO_COOKIE_NAME);
    return;
  }

  debugLog('Setting session cookie', {
    length: value.length,
    preview: `${value.slice(0, 10)}...`,
    cookieSecure: serverLogtoConfig.cookieSecure,
  });
  response.cookies.set({
    name: LOGTO_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: serverLogtoConfig.cookieSecure,
    sameSite: serverLogtoConfig.cookieSecure ? 'none' : 'lax',
    path: '/',
    maxAge: LOGTO_COOKIE_MAX_AGE,
  });
};

const readCookieHeader = (request: NextRequest) => request.headers.get('cookie') ?? '';

const readSessionCookie = (request: NextRequest) =>
  LOGTO_COOKIE_NAME ? request.cookies.get(LOGTO_COOKIE_NAME)?.value ?? '' : '';

const resolveRedirectDestination = (request: NextRequest) =>
  request.nextUrl.searchParams.get('redirectTo') ??
  serverLogtoConfig.baseUrl ??
  request.nextUrl.origin;

const notImplemented = () =>
  NextResponse.json({ error: 'Unsupported Logto action' }, { status: 404 });

const resolveAction = (request: NextRequest): string => {
  // The catch-all segment provides the remaining path after /logto/
  // We only care about the final segment (e.g., 'sign-in', 'sign-out')
  const pathname = request.nextUrl.pathname.replace(/\/$/, '');
  const segments = pathname.split('/');
  return segments[segments.length - 1] ?? '';
};

async function handle(request: NextRequest) {
  const action = resolveAction(request);

  switch (action) {
    case 'sign-in': {
      const callback = buildCallbackUrl(request);
      debugLog('Using redirect_uri:', callback);
      const sessionCookie = readSessionCookie(request);
      debugLog('Incoming cookies before sign-in', readCookieHeader(request));
      debugLog('Existing session cookie length', sessionCookie.length);
      const { url, newCookie } = await logtoClient.handleSignIn(
        sessionCookie,
        callback,
      );
      debugLog('handleSignIn returned', {
        hasCookie: Boolean(newCookie),
        redirect: url,
      });
      const response = NextResponse.redirect(url);
      // The sign-in session cookie MUST be set on the response that redirects to Logto.
      applySessionCookie(response, newCookie);
      const setCookieHeader = response.headers.get('set-cookie');
      debugLog('Response set-cookie header', setCookieHeader);
      return response;
    }

    case 'sign-in-callback': {
      debugLog('Callback request cookies', readCookieHeader(request));
      debugLog('Callback request URL', request.url);
      const sessionCookie = readSessionCookie(request);
      debugLog('Callback session cookie length', sessionCookie.length);
      const newCookie = await logtoClient.handleSignInCallback(
        sessionCookie,
        request.url,
      );
      debugLog('handleSignInCallback succeeded', { hasCookie: Boolean(newCookie) });
      const response = NextResponse.redirect(resolveRedirectDestination(request));
      if (newCookie) {
        applySessionCookie(response, newCookie);
      }
      return response;
    }

    case 'sign-out': {
      const sessionCookie = readSessionCookie(request);
      const signOutRedirect = await logtoClient.handleSignOut(
        sessionCookie,
        resolveRedirectDestination(request),
      );
      const response = NextResponse.redirect(signOutRedirect);
      applySessionCookie(response);
      return response;
    }

    case 'user': {
      const sessionCookie = readSessionCookie(request);
      try {
        const context = await logtoClient.getLogtoContext(sessionCookie);
        return NextResponse.json(context ?? null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to fetch Logto context';
        return NextResponse.json({ error: message }, { status: 401 });
      }
    }

    default:
      return notImplemented();
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
