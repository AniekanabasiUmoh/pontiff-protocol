'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { State, WagmiProvider } from 'wagmi';
import { config } from '../config/wagmi';
import { ReactNode } from 'react';

// Create QueryClient outside component to prevent re-initialization
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

export function Web3Provider({
    children,
    initialState
}: {
    children: ReactNode;
    initialState?: State;
}) {
    return (
        <WagmiProvider config={config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    initialChain={10143} // Monad Testnet
                    theme={darkTheme({
                        accentColor: '#8B0000', // Dark red for "Gothic" theme
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                        fontStack: 'system',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
