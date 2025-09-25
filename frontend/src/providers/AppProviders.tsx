'use client';

import { LogtoProvider } from '@logto/next/client';
import type { ReactNode } from 'react';
import { clientLogtoConfig } from '@/lib/logto/config';
import { AuthProvider } from '@/contexts/AuthContext';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <LogtoProvider config={clientLogtoConfig}>
      <AuthProvider>{children}</AuthProvider>
    </LogtoProvider>
  );
}
