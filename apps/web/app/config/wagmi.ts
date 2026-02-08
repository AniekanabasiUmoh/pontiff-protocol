import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet } from './chains'
import { type Config, createStorage, cookieStorage } from 'wagmi'

let _wagmiConfig: Config | null = null

export function getWagmiConfig(): Config {
    if (!_wagmiConfig) {
        _wagmiConfig = getDefaultConfig({
            appName: 'The Pontiff',
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
            chains: [monadTestnet],
            ssr: true,
            storage: createStorage({
                storage: cookieStorage,
            }),
        })
    }
    return _wagmiConfig
}
