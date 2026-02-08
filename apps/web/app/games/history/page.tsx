'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/db/supabase';

interface GameHistoryItem {
    id: string;
    gameType: string;
    player1: string;
    winner: string;
    wager: string;
    createdAt?: string;
    result?: any;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<GameHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const formatGame = (game: any): GameHistoryItem => {
        let winner = 'Unknown';
        if (game.game_type === 'RPS') {
            const outcome = game.result?.outcome;
            winner = outcome === 'WIN' ? 'Player' : outcome === 'LOSS' ? 'ThePontiff' : 'Draw';
        } else if (game.game_type === 'JUDAS') {
            const action = game.result?.action;
            winner = action === 'BETRAY' ? 'Betrayal' : action === 'STAKE' ? 'Staked' : 'Withdrawn';
        } else if (game.result?.winner) {
            winner = game.result.winner; // Poker?
        }

        return {
            id: game.id,
            gameType: game.game_type || game.gameType || 'Unknown',
            player1: game.player1 || 'Unknown',
            winner,
            wager: game.wager || '0',
            createdAt: game.created_at,
            result: game.result
        };
    };

    useEffect(() => {
        // Initial Fetch
        fetch('/api/games/history')
            .then(res => res.json())
            .then(data => {
                const games = (data.history || []).map(formatGame);
                setHistory(games);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Real-time Subscription
        const channel = supabase
            .channel('public:games')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'games' },
                (payload) => {
                    console.log('New game received:', payload.new);
                    const newGame = formatGame(payload.new);
                    setHistory(prev => [newGame, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-5xl font-bold mb-8 text-red-500 text-center">📜 THE CHRONICLES</h1>
                <p className="text-center text-gray-400 mb-12">Every challenge against the Pontiff is recorded.</p>

                {loading ? (
                    <div className="text-center">Loading chronicles...</div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((game, i) => (
                            <motion.div
                                key={game.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-gray-900 border border-gray-800 p-6 rounded-lg flex items-center justify-between hover:border-red-500/50 transition-colors"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`text-4xl 
                                        ${game.gameType === 'Poker' ? 'grayscale opacity-70' : ''}
                                        ${game.gameType === 'JUDAS' ? 'text-yellow-500' : ''}
                                    `}>
                                        {game.gameType === 'Poker' ? '🃏' : game.gameType === 'JUDAS' ? '🗡️' : '✂️'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-xl text-white">{game.gameType} Protocol</div>
                                        <div className="text-sm text-gray-500 font-mono">
                                            Player: {game.player1.slice(0, 6)}...
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <div className={`font-bold text-lg 
                                        ${game.winner === 'ThePontiff' ? 'text-red-500' : ''}
                                        ${game.winner === 'Player' ? 'text-green-500' : ''}
                                        ${game.winner === 'Betrayal' ? 'text-red-600' : ''}
                                        ${game.winner === 'Staked' ? 'text-blue-500' : ''}
                                        ${game.winner === 'Withdrawn' ? 'text-green-400' : ''}
                                    `}>
                                        {game.winner === 'ThePontiff' ? 'PONTIFF VICTORY' :
                                            game.winner === 'Player' ? 'HERETIC VICTORY' :
                                                game.winner.toUpperCase()}
                                    </div>
                                    <div className="text-yellow-500 font-mono text-sm">
                                        {game.wager} GUILT
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {history.length === 0 && (
                            <div className="text-center text-gray-500 italic py-20">
                                The pages of history are blank... for now.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
