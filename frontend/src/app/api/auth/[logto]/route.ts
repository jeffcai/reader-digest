import { NextRequest, NextResponse } from 'next/server';
import { logtoClient, LOGTO_COOKIE_MAX_AGE, LOGTO_COOKIE_NAME } from '@/lib/logto/server';
import { serverLogtoConfig } from '@/lib/logto/config';

const resolveBaseUrl = (request: NextRequest) =>
	serverLogtoConfig.baseUrl && serverLogtoConfig.baseUrl.length > 0
		? serverLogtoConfig.baseUrl
		: request.nextUrl.origin;

const buildCallbackUrl = (request: NextRequest) => {
	const baseUrl = resolveBaseUrl(request);
	const callbackUrl = new URL('/api/auth/logto/sign-in-callback', baseUrl);

	const redirectTo = request.nextUrl.searchParams.get('redirectTo');
	if (redirectTo) {
		callbackUrl.searchParams.set('redirectTo', redirectTo);
	}

	return callbackUrl.toString();
};

const applySessionCookie = (response: NextResponse, value?: string) => {
	if (!LOGTO_COOKIE_NAME) {
		return;
	}

	if (!value) {
		response.cookies.delete(LOGTO_COOKIE_NAME);
		return;
	}

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

const resolveRedirectDestination = (request: NextRequest) =>
	request.nextUrl.searchParams.get('redirectTo') ??
	serverLogtoConfig.baseUrl ??
	request.nextUrl.origin;

const notImplemented = () =>
	NextResponse.json({ error: 'Unsupported Logto action' }, { status: 404 });

const resolveAction = (request: NextRequest) => {
	const pathname = request.nextUrl.pathname.replace(/\/$/, '');
	const segments = pathname.split('/');
	return segments[segments.length - 1] ?? '';
};

export async function GET(request: NextRequest) {
	const action = resolveAction(request);

	switch (action) {
		case 'sign-in': {
					const { url, newCookie } = await logtoClient.handleSignIn(
						readCookieHeader(request),
						buildCallbackUrl(request),
					);
			const response = NextResponse.redirect(url);
			if (newCookie) {
				applySessionCookie(response, newCookie);
			}
			return response;
		}

		case 'sign-in-callback': {
			const newCookie = await logtoClient.handleSignInCallback(
				readCookieHeader(request),
				request.url,
			);
			const response = NextResponse.redirect(resolveRedirectDestination(request));
			if (newCookie) {
				applySessionCookie(response, newCookie);
			}
			return response;
		}

		case 'sign-out': {
			const signOutRedirect = await logtoClient.handleSignOut(
				readCookieHeader(request),
				resolveRedirectDestination(request),
			);
			const response = NextResponse.redirect(signOutRedirect);
			applySessionCookie(response);
			return response;
		}

		case 'user': {
			try {
				const context = await logtoClient.getLogtoContext(readCookieHeader(request));
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

		export async function POST(request: NextRequest) {
			return GET(request);
}
