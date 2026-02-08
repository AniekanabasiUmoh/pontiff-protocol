/**
 * WIDGET 3: Active Games
 * Shows currently ongoing matches
 */

'use client';

import Link from 'next/link';

interface ActiveGame {
    id: string;
    gameType: string;
    opponent: string;
    wager: string;
    status: string;
}

interface ActiveGamesWidgetProps {
    games: ActiveGame[];
}

function formatGameType(type: string): string {
    const types: Record<string, string> = {
        'RPS': 'Rock Paper Scissors',
        'Poker': 'Texas Hold\'em',
        'JudasProtocol': 'Judas Protocol'
    };
    return types[type] || type;
}

function formatAddress(address: string): string {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ActiveGamesWidget({ games }: ActiveGamesWidgetProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-300">Active Games</h2>
                <Link
                    href="/games"
                    className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                    View All →
                </Link>
            </div>
            <div className="space-y-3">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="flex justify-between items-center bg-black/50 p-3 rounded border border-gray-800 hover:border-red-900/50 transition-colors"
                    >
                        <div className="flex-1">
                            <div className="text-red-400 font-bold text-sm">
                                {formatGameType(game.gameType)}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                                vs {formatAddress(game.opponent)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-yellow-500 font-bold text-sm">
                                {game.wager} GUILT
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                                {game.status}
                            </div>
                        </div>
                    </div>
                ))}
                {games.length === 0 && (
                    <div className="text-center text-gray-600 italic py-8 text-sm">
                        No active games. Waiting for challengers...
                    </div>
                )}
            </div>
        </div>
    );
}
