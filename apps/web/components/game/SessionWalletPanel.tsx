'use client';

import { useState } from 'react';
import { useSessionWallet } from '@/lib/hooks/useSessionWallet';
import { formatEther } from 'viem';

const STRATEGIES = [
    { id: 0, name: 'Berzerker', icon: '⚔️', fee: 10, color: 'red' },
    { id: 1, name: 'Merchant', icon: '💰', fee: 15, color: 'yellow' },
    { id: 2, name: 'Disciple', icon: '🙏', fee: 5, color: 'green' },
] as const;

/**
 * Panel for managing session wallet
 * Allows creating sessions, viewing balance, and withdrawing funds
 */
export function SessionWalletPanel() {
    const { sessionAddress, balance, isLoading, error, createSession, withdraw, hasActiveSession } = useSessionWallet();
    const [selectedStrategy, setSelectedStrategy] = useState<0 | 1 | 2>(1); // Default: Merchant
    const [showCreate, setShowCreate] = useState(!hasActiveSession);

    const handleCreateSession = async () => {
        await createSession(selectedStrategy);
    };

    if (!showCreate && hasActiveSession) {
        // Show active session info
        return (
            <div className="bg-gray-900/50 border border-primary/30 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-mono text-primary">SESSION ACTIVE</span>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="text-xs text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Balance:</span>
                        <span className="text-lg font-bold text-primary">{formatEther(balance)} GUILT</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Address:</span>
                        <span className="text-xs font-mono text-gray-300">
                            {sessionAddress?.slice(0, 6)}...{sessionAddress?.slice(-4)}
                        </span>
                    </div>

                    <button
                        onClick={withdraw}
                        disabled={isLoading || balance === 0n}
                        className="w-full mt-3 bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                        {isLoading ? 'Processing...' : 'Withdraw All'}
                    </button>
                </div>

                {error && (
                    <p className="text-xs text-red-400 mt-2">{error}</p>
                )}
            </div>
        );
    }

    // Show create session UI
    return (
        <div className="bg-gray-900/50 border border-primary/30 rounded p-4">
            <h3 className="text-sm font-bold text-primary mb-3">⚡ Create Session for Instant Play</h3>

            <p className="text-xs text-gray-400 mb-4">
                Deposit once, play instantly without wallet popups
            </p>

            {/* Strategy Selection */}
            <div className="space-y-2 mb-4">
                {STRATEGIES.map((strategy) => (
                    <button
                        key={strategy.id}
                        onClick={() => setSelectedStrategy(strategy.id)}
                        className={`w-full p-3 rounded border-2 transition-all text-left ${selectedStrategy === strategy.id
                                ? strategy.id === 0
                                    ? 'border-red-500 bg-red-900/20' // Berzerker
                                    : strategy.id === 1
                                        ? 'border-yellow-500 bg-yellow-900/20' // Merchant
                                        : 'border-green-500 bg-green-900/20' // Disciple
                                : 'border-gray-700 bg-black/30 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{strategy.icon}</span>
                                <div>
                                    <div className="text-sm font-bold text-white">{strategy.name}</div>
                                    <div className="text-xs text-gray-400">Fee: {strategy.fee} GUILT</div>
                                </div>
                            </div>
                            {selectedStrategy === strategy.id && (
                                <span className="text-primary">✓</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-bold px-4 py-3 rounded transition-colors"
            >
                {isLoading ? 'Creating...' : `Create Session (${STRATEGIES[selectedStrategy].fee} GUILT fee)`}
            </button>

            {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
            )}

            {hasActiveSession && (
                <button
                    onClick={() => setShowCreate(false)}
                    className="w-full mt-2 text-xs text-gray-400 hover:text-white"
                >
                    ← Back to active session
                </button>
            )}
        </div>
    );
}
