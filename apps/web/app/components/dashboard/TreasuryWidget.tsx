/**
 * WIDGET 7: Treasury Widget
 * Shows GUILT balance and growth
 */

'use client';

import { useState, useEffect } from 'react';

interface TreasuryWidgetProps {
    treasuryBalance: string;
}

function formatBalance(balance: string): string {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    return num.toLocaleString();
}

export default function TreasuryWidget({ treasuryBalance }: TreasuryWidgetProps) {
    const [displayBalance, setDisplayBalance] = useState('0');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Animate number counting up
        setIsAnimating(true);
        const targetBalance = parseFloat(treasuryBalance);
        const duration = 1000; // 1 second
        const steps = 20;
        const increment = targetBalance / steps;
        let current = 0;

        const interval = setInterval(() => {
            current += increment;
            if (current >= targetBalance) {
                setDisplayBalance(treasuryBalance);
                setIsAnimating(false);
                clearInterval(interval);
            } else {
                setDisplayBalance(Math.floor(current).toString());
            }
        }, duration / steps);

        return () => clearInterval(interval);
    }, [treasuryBalance]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Vatican Treasury</h2>

            {/* Main Balance Display */}
            <div className="text-center py-6 bg-black/50 rounded-lg border border-gray-800 mb-4">
                <div className="text-5xl font-black text-yellow-500 mb-2 font-mono">
                    {formatBalance(displayBalance)}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">
                    $GUILT Tokens
                </div>
            </div>

            {/* Treasury Sources */}
            <div className="space-y-2">
                <h3 className="text-xs text-gray-500 uppercase font-bold mb-3">Revenue Sources</h3>

                <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎲</span>
                        <span className="text-sm text-gray-400">Game Winnings</span>
                    </div>
                    <span className="text-green-500 text-sm font-bold">+5%</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">💸</span>
                        <span className="text-sm text-gray-400">Token Taxes</span>
                    </div>
                    <span className="text-green-500 text-sm font-bold">+2%</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">💎</span>
                        <span className="text-sm text-gray-400">Staking Fees</span>
                    </div>
                    <span className="text-green-500 text-sm font-bold">+1%</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🗡️</span>
                        <span className="text-sm text-gray-400">Betrayal Slashing</span>
                    </div>
                    <span className="text-yellow-500 text-sm font-bold">Variable</span>
                </div>
            </div>

            {/* Treasury Stats */}
            <div className="mt-4 p-3 bg-black/30 rounded border border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">24h Change</div>
                        <div className="text-green-500 font-bold">+8.2%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">All-Time High</div>
                        <div className="text-yellow-500 font-bold">150K</div>
                    </div>
                </div>
            </div>

            {/* Allocation Info */}
            <div className="mt-4 text-xs text-gray-600 text-center">
                <div className="mb-1">💰 Game Reserves: 10%</div>
                <div>⚔️ Crusade Fund: 5%</div>
            </div>
        </div>
    );
}
