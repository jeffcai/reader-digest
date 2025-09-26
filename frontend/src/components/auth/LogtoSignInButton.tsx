'use client';

interface Props {
  redirectTo?: string;
}

export function LogtoSignInButton({ redirectTo }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        const searchParams = new URLSearchParams();
        if (redirectTo) {
          searchParams.set('redirectTo', redirectTo);
        }
        const query = searchParams.toString();
        window.location.href = `/api/auth/logto/sign-in${query ? `?${query}` : ''}`;
      }}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      Continue with Logto
    </button>
  );
}
