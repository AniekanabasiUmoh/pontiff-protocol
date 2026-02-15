'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './chains';
import { cookieStorage, createStorage, http } from 'wagmi';

export const config = getDefaultConfig({
    appName: 'The Pontiff',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64',
    chains: [monadTestnet],
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
    transports: {
        [monadTestnet.id]: http(),
    },
});
