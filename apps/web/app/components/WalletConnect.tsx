'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '../hooks/useAuth'
import { useAccount } from 'wagmi'

export function WalletConnect() {
    const { address, isConnected } = useAccount()
    const { isAuthenticated, isLoading, signIn, signOut } = useAuth()

    return (
        <div className="flex flex-col items-center gap-4 p-8 border border-gray-700 rounded-lg bg-gray-900">
            <h2 className="text-2xl font-bold text-red-600">The Pontiff Awaits</h2>

            {/* RainbowKit Connect Button */}
            <ConnectButton />

            {/* SIWE Authentication */}
            {isConnected && !isAuthenticated && !isLoading && (
                <button
                    onClick={signIn}
                    className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold transition-colors"
                >
                    Sign In to Confess
                </button>
            )}

            {isAuthenticated && (
                <div className="flex flex-col items-center gap-2">
                    <p className="text-green-500 font-semibold">✓ Authenticated</p>
                    <p className="text-sm text-gray-400">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    <button
                        onClick={signOut}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}
