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

            // Verify with backend and get access token
            let accessToken = null;
            try {
				const cookieForContext = newCookie ?? readCookieHeader(request);
				if (cookieForContext) {
					const context = await logtoClient.getLogtoContext(cookieForContext);
					if (context.isAuthenticated && context.userInfo?.email) {
						const exchangeResponse = await fetch(`${process.env.LOGTO_BACKEND_API_URL || 'http://localhost:5001'}/api/v1/auth/logto/exchange`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								email: context.userInfo.email,
								sub: context.userInfo.sub,
								name: context.userInfo.name,
								secret: process.env.LOGTO_EXCHANGE_SECRET
							})
						});
                        
						if (exchangeResponse.ok) {
							const data = await exchangeResponse.json();
							accessToken = data.access_token;
						} else {
							console.error('Token exchange failed:', await exchangeResponse.text());
						}
					}
				}
            } catch (error) {
                console.error('Token exchange error:', error);
            }

			const response = NextResponse.redirect(resolveRedirectDestination(request));
			if (newCookie) {
				applySessionCookie(response, newCookie);
			}
            
            if (accessToken) {
                response.cookies.set('access_token', accessToken, {
                    httpOnly: false, // Allow client-side access for API calls
                    path: '/',
                    maxAge: 86400 // 1 day
                });
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
