import { NextRequest, NextResponse } from 'next/server';

// This is a backward-compatible alias for the originally registered redirect URI
// (http://localhost:3000/api/auth/callback). It simply rewrites/redirects to the
// new Logto-specific callback endpoint so we don't need to immediately change
// the configured redirect URIs in the Logto dashboard.

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // Preserve existing query params (code, state, error, etc.) and forward them.
  const forward = new URL('/api/auth/logto/sign-in-callback', url.origin);
  url.searchParams.forEach((value, key) => {
    forward.searchParams.set(key, value);
  });
  return NextResponse.redirect(forward.toString());
}

export const dynamic = 'force-dynamic';
