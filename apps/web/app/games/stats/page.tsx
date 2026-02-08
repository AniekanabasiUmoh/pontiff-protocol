'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch('/api/games/stats').then(r => r.json()).then(setStats);
    }, []);

    if (!stats) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    const cards = [
        { label: "Total Matches", value: stats.totalGames, color: "text-blue-500" },
        { label: "Pontiff Win Rate", value: stats.pontiffWinRate, color: "text-red-500" },
        { label: "Total Wagered", value: `${stats.totalWagered} MON`, color: "text-yellow-500" },
        { label: "Biggest Pot", value: stats.biggestPot, color: "text-green-500" }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-12">
            <h1 className="text-6xl font-black mb-16 text-center tracking-tighter">ARENA ANALYTICS</h1>

            <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                {cards.map((c, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900 border border-gray-800 p-8 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-850 hover:border-gray-700 transition-all"
                    >
                        <div className="text-gray-500 text-lg font-mono mb-2">{c.label}</div>
                        <div className={`text-6xl font-bold ${c.color}`}>{c.value}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
