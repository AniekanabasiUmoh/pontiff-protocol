'use client';

import { useEffect, useState, useCallback } from 'react';

// Fallback mock data when no real data is available
const MOCK_GAMES = [
    { id: 1, agent: 'The Merchant', game: 'Poker', wager: '500 GUILT', result: 'WIN', profit: '+450 GUILT', time: '2m ago' },
    { id: 2, agent: 'The Berzerker', game: 'RPS', wager: '1200 GUILT', result: 'LOSS', profit: '-1200 GUILT', time: '5m ago' },
    { id: 3, agent: 'The Disciple', game: 'Staking', wager: '5000 GUILT', result: 'STAKE', profit: '+12 GUILT', time: '10m ago' },
    { id: 4, agent: 'The Berzerker', game: 'RPS', wager: '2500 GUILT', result: 'WIN', profit: '+2500 GUILT', time: '12m ago' },
];

interface GameEntry {
    id: string | number;
    agent: string;
    game: string;
    wager: string;
    result: string;
    profit: string;
    time: string;
}

export function LiveGameFeed() {
    const [games, setGames] = useState<GameEntry[]>(MOCK_GAMES);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isUsingMockData, setIsUsingMockData] = useState(true);

    // Fetch recent games from API
    const fetchGames = useCallback(async () => {
        try {
            const response = await fetch('/api/games/recent?limit=10');
            const data = await response.json();

            if (data.success && data.games && data.games.length > 0) {
                setGames(data.games);
                setIsUsingMockData(false);
                setError(null);
            } else if (data.useMockData) {
                // API explicitly says to use mock data
                setGames(MOCK_GAMES);
                setIsUsingMockData(true);
            } else {
                // Unexpected response, keep current state
                setError(data.error || 'Unknown error');
            }

            setLastUpdate(new Date());
            setIsLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch games:', err);
            setError(err.message);
            setIsLoading(false);
            // Keep showing current games (mock or real)
        }
    }, []);

    // Initial fetch and polling setup
    useEffect(() => {
        fetchGames();

        // Poll every 30 seconds for updates
        const interval = setInterval(fetchGames, 30000);

        return () => clearInterval(interval);
    }, [fetchGames]);

    // Determine result color
    const getResultColor = (result: string): string => {
        const r = result.toUpperCase();
        if (r === 'WIN' || r === 'WON' || r === 'REDEEMED') return 'bg-green-500';
        if (r === 'LOSS' || r === 'LOST' || r === 'CONFESSED') return 'bg-red-500';
        return 'bg-blue-500';
    };

    const getTextColor = (result: string): string => {
        const r = result.toUpperCase();
        if (r === 'WIN' || r === 'WON' || r === 'REDEEMED') return 'text-green-500';
        if (r === 'LOSS' || r === 'LOST' || r === 'CONFESSED') return 'text-red-500';
        return 'text-blue-500';
    };

    return (
        <div className="bg-black/50 border border-[#D4AF37]/30 rounded-lg p-4 overflow-hidden h-[400px] relative">
            {/* Header with live indicator */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D4AF37]/20">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isUsingMockData ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
                    <span className="text-xs text-gray-400">
                        {isUsingMockData ? 'Demo Mode' : 'LIVE'}
                    </span>
                </div>
                {lastUpdate && (
                    <span className="text-xs text-gray-500">
                        Updated {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="text-[#D4AF37] animate-pulse">Loading...</div>
                </div>
            )}

            {/* Games list with scroll animation */}
            <div className="space-y-3 overflow-y-auto h-[320px] pr-2 custom-scrollbar">
                {games.map((game, i) => (
                    <div
                        key={`${game.id}-${i}`}
                        className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333] hover:border-[#D4AF37] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getResultColor(game.result)}`} />
                            <div>
                                <p className="text-[#D4AF37] font-bold text-sm">{game.agent}</p>
                                <p className="text-gray-400 text-xs">{game.game} • {game.time}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-mono text-sm">{game.wager}</p>
                            <p className={`text-xs ${getTextColor(game.result)}`}>
                                {game.profit}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Show more games duplicated for visual effect */}
                {games.length < 4 && games.map((game, i) => (
                    <div
                        key={`${game.id}-${i}-dup`}
                        className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333] opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getResultColor(game.result)}`} />
                            <div>
                                <p className="text-[#D4AF37] font-bold text-sm">{game.agent}</p>
                                <p className="text-gray-400 text-xs">{game.game} • {game.time}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-mono text-sm">{game.wager}</p>
                            <p className={`text-xs ${getTextColor(game.result)}`}>
                                {game.profit}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
    );
}
