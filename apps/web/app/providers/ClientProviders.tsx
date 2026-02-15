'use client';

import dynamic from 'next/dynamic';
import { ToastProvider } from '../components/ui/Toast';
import { Shell } from '../../components/layout/Shell';

const Web3Provider = dynamic(
  () => import('./Web3Provider').then((m) => m.Web3Provider),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ToastProvider>
        <Shell>
          {children}
        </Shell>
      </ToastProvider>
    </Web3Provider>
  );
}
