/**
 * WIDGET 6: Leaderboards
 * Top sinners, saints, heretics
 */

'use client';

import { useState } from 'react';

interface LeaderboardEntry {
    wallet_address: string;
    score?: string | number;
    amount?: string;
}

interface LeaderboardsWidgetProps {
    leaderboards: {
        topSinners: LeaderboardEntry[];
        topSaints: LeaderboardEntry[];
        topHeretics: LeaderboardEntry[];
    };
}

type LeaderboardType = 'sinners' | 'saints' | 'heretics';

function formatAddress(address: string): string {
    if (!address) return 'Unknown';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function getRankEmoji(index: number): string {
    const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    return emojis[index] || `${index + 1}`;
}

export default function LeaderboardsWidget({ leaderboards }: LeaderboardsWidgetProps) {
    const [activeTab, setActiveTab] = useState<LeaderboardType>('sinners');

    const tabs: { key: LeaderboardType; label: string; icon: string }[] = [
        { key: 'sinners', label: 'Top Sinners', icon: '😈' },
        { key: 'saints', label: 'Top Saints', icon: '😇' },
        { key: 'heretics', label: 'Top Heretics', icon: '🔥' }
    ];

    const getActiveData = (): LeaderboardEntry[] => {
        switch (activeTab) {
            case 'sinners':
                return leaderboards.topSinners;
            case 'saints':
                return leaderboards.topSaints;
            case 'heretics':
                return leaderboards.topHeretics;
            default:
                return [];
        }
    };

    const activeData = getActiveData();

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Leaderboards</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all ${activeTab === tab.key
                                ? 'bg-red-600 text-white'
                                : 'bg-black/50 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <span className="mr-1">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            <div className="space-y-2">
                {activeData.slice(0, 5).map((entry, index) => (
                    <div
                        key={entry.wallet_address || index}
                        className="flex items-center gap-3 bg-black/50 p-3 rounded border border-gray-800 hover:border-red-900/50 transition-colors"
                    >
                        <span className="text-xl">{getRankEmoji(index)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-300 font-mono truncate">
                                {formatAddress(entry.wallet_address)}
                            </div>
                        </div>
                        {entry.score && (
                            <div className="text-yellow-500 font-bold text-sm">
                                {entry.score}
                            </div>
                        )}
                    </div>
                ))}
                {activeData.length === 0 && (
                    <div className="text-center text-gray-600 italic py-8 text-sm">
                        No entries yet. Be the first!
                    </div>
                )}
            </div>
        </div>
    );
}
