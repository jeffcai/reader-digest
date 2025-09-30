import { NextRequest, NextResponse } from 'next/server';
import { logtoClient, LOGTO_COOKIE_MAX_AGE, LOGTO_COOKIE_NAME } from '@/lib/logto/server';
import { serverLogtoConfig } from '@/lib/logto/config';

const LOGTO_REDIRECT_COOKIE = 'logto_redirect_to';
const ACCESS_TOKEN_COOKIE = 'access_token';
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const backendApiBaseUrl =
  process.env.LOGTO_BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5001';
const backendExchangeSecret = process.env.LOGTO_BACKEND_SECRET;

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

const sanitizeRedirectTarget = (value: string | null | undefined) => {
  if (!value) {
    return '/admin';
  }

  if (value.startsWith('/')) {
    return value;
  }

  return '/admin';
};

const buildCallbackUrl = (request: NextRequest) => {
  const baseUrl = resolveBaseUrl(request);
  // The URI sent to Logto must exactly match one of the URIs registered in the Logto admin console.
  const callbackUrl = new URL('/api/auth/logto/sign-in-callback', baseUrl);
  return callbackUrl.toString();
};

const buildAbsoluteUrl = (request: NextRequest, target: string) =>
  new URL(target, resolveBaseUrl(request)).toString();

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

const readRedirectCookie = (request: NextRequest) =>
  request.cookies.get(LOGTO_REDIRECT_COOKIE)?.value;

const resolveRedirectDestination = (request: NextRequest) =>
  readRedirectCookie(request) ??
  sanitizeRedirectTarget(request.nextUrl.searchParams.get('redirectTo')) ??
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
      const redirectTarget = sanitizeRedirectTarget(request.nextUrl.searchParams.get('redirectTo'));
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
      response.cookies.set({
        name: LOGTO_REDIRECT_COOKIE,
        value: redirectTarget,
        httpOnly: true,
        secure: serverLogtoConfig.cookieSecure,
        sameSite: serverLogtoConfig.cookieSecure ? 'none' : 'lax',
        path: '/',
        maxAge: 10 * 60, // 10 minutes window to complete auth flow
      });
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
      const activeSessionCookie = newCookie ?? sessionCookie;

  let claims: Record<string, unknown> | undefined;
      try {
        const context = await logtoClient.getLogtoContext(activeSessionCookie);
        const derivedClaims =
          context?.claims ??
          (context && 'idTokenClaims' in context
            ? (context as { idTokenClaims?: Record<string, unknown> }).idTokenClaims
            : undefined) ??
          (context && 'userInfo' in context
            ? (context as { userInfo?: Record<string, unknown> }).userInfo
            : undefined);
        claims = derivedClaims;
        debugLog('Retrieved Logto claims keys', claims ? Object.keys(claims) : []);
      } catch (error) {
        debugLog('Failed to obtain Logto context', error);
      }

      const logtoId = claims?.sub as string | undefined;
      const email = (claims?.email as string | undefined) ?? undefined;
      const username = (claims?.preferred_username as string | undefined) ?? (claims?.username as string | undefined);
      const displayName = (claims?.name as string | undefined) ?? undefined;
      const firstName = (claims?.given_name as string | undefined) ?? undefined;
      const lastName = (claims?.family_name as string | undefined) ?? undefined;

      if (!backendExchangeSecret) {
        debugLog('Missing LOGTO_BACKEND_SECRET env variable');
        const response = NextResponse.redirect(
          buildAbsoluteUrl(request, '/login?error=logto-misconfigured'),
        );
        applySessionCookie(response, activeSessionCookie);
        response.cookies.delete(LOGTO_REDIRECT_COOKIE);
        return response;
      }

      if (!logtoId || !email) {
        debugLog('Missing required Logto claims', { logtoId, email });
        const response = NextResponse.redirect(
          buildAbsoluteUrl(request, '/login?error=logto-profile'),
        );
        applySessionCookie(response, activeSessionCookie);
        response.cookies.delete(LOGTO_REDIRECT_COOKIE);
        return response;
      }

      const exchangePayload = {
        logto_id: logtoId,
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      };

      let accessToken: string | undefined;
      try {
        const exchangeResponse = await fetch(`${backendApiBaseUrl}/api/v1/auth/logto/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Logto-Exchange-Secret': backendExchangeSecret,
          },
          body: JSON.stringify(exchangePayload),
        });

        if (!exchangeResponse.ok) {
          const errorBody = await exchangeResponse.text();
          debugLog('Backend exchange failed', exchangeResponse.status, errorBody);
          const response = NextResponse.redirect(
            buildAbsoluteUrl(request, '/login?error=logto-exchange'),
          );
          applySessionCookie(response, activeSessionCookie);
          response.cookies.delete(LOGTO_REDIRECT_COOKIE);
          return response;
        }

        const exchangeResult = await exchangeResponse.json();
        accessToken = exchangeResult?.access_token;
        debugLog('Backend exchange succeeded', {
          hasToken: Boolean(accessToken),
        });
      } catch (error) {
        debugLog('Backend exchange request failed', error);
        const response = NextResponse.redirect(
          buildAbsoluteUrl(request, '/login?error=logto-exchange'),
        );
        applySessionCookie(response, activeSessionCookie);
        response.cookies.delete(LOGTO_REDIRECT_COOKIE);
        return response;
      }

      const redirectTarget = resolveRedirectDestination(request) || '/admin';
      const response = NextResponse.redirect(
        buildAbsoluteUrl(request, redirectTarget),
      );
      applySessionCookie(response, activeSessionCookie);
      response.cookies.delete(LOGTO_REDIRECT_COOKIE);

      if (accessToken) {
        response.cookies.set({
          name: ACCESS_TOKEN_COOKIE,
          value: accessToken,
          httpOnly: false,
          secure: serverLogtoConfig.cookieSecure,
          sameSite: serverLogtoConfig.cookieSecure ? 'none' : 'lax',
          path: '/',
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
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
