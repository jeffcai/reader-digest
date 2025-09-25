'use client';

import { useLogto } from '@logto/next/client';

interface Props {
  redirectTo?: string;
}

export function LogtoSignInButton({ redirectTo }: Props) {
  const { signIn, isAuthenticated } = useLogto();

  if (isAuthenticated) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => signIn(redirectTo ? { redirectTo } : undefined)}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      Continue with Logto
    </button>
  );
}
