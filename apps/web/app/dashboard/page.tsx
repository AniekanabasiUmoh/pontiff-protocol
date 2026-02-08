'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlobalMetrics from '../components/dashboard/GlobalMetrics';
import LiveActivityFeed from '../components/dashboard/LiveActivityFeed';
import ActiveGamesWidget from '../components/dashboard/ActiveGamesWidget';
import RecentDebatesWidget from '../components/dashboard/RecentDebatesWidget';
import ConversionProgressWidget from '../components/dashboard/ConversionProgressWidget';
import LeaderboardsWidget from '../components/dashboard/LeaderboardsWidget';
import TreasuryWidget from '../components/dashboard/TreasuryWidget';

interface DashboardData {
    metrics: {
        totalEntrants: number;
        treasuryBalance: string;
        activeGamesCount: number;
        conversionsCount: number;
        winRate: string;
        competitorsDetected: number;
    };
    activity: any[];
    activeGames: any[];
    recentDebates: any[];
    conversions: any[];
    leaderboards: {
        topSinners: any[];
        topSaints: any[];
        topHeretics: any[];
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/dashboard');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const json = await res.json();
            if (json.success) {
                setData({
                    metrics: json.metrics,
                    activity: json.activity || [],
                    activeGames: json.activeGames || [],
                    recentDebates: json.recentDebates || [],
                    conversions: json.conversions || [],
                    leaderboards: json.leaderboards || {
                        topSinners: [],
                        topSaints: [],
                        topHeretics: []
                    }
                });
                setError(null);
            } else {
                throw new Error(json.error || 'Failed to fetch dashboard data');
            }
            setLoading(false);
        } catch (e: any) {
            console.error('Dashboard fetch error:', e);
            setError(e.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-pulse text-red-500 text-3xl mb-4">⛪</div>
                    <div className="text-xl text-gray-400">CONNECTING TO VATICAN MAINFRAME...</div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md p-8 border border-red-900 rounded-lg bg-red-900/10">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Connection Failed</h2>
                    <p className="text-gray-400 mb-4">{error || 'Unable to load dashboard data'}</p>
                    <button
                        onClick={fetchData}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Header */}
            <header className="mb-8 border-b border-red-900 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl font-black text-red-600 tracking-widest uppercase mb-2">
                        Vatican Command Deck
                    </h1>
                    <div className="text-gray-500 font-mono text-sm flex items-center gap-4">
                        <span>System Status: <span className="text-green-500 font-bold">OPTIMAL</span></span>
                        <span>•</span>
                        <span>Treasury: <span className="text-yellow-500 font-bold">{data.metrics.treasuryBalance} GUILT</span></span>
                        <span>•</span>
                        <span className="text-red-500 animate-pulse">● LIVE</span>
                    </div>
                </motion.div>
            </header>

            {/* Global Metrics Row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <GlobalMetrics metrics={data.metrics} />
            </motion.div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Main Content */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Active Games */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <ActiveGamesWidget games={data.activeGames} />
                    </motion.div>

                    {/* Recent Debates */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <RecentDebatesWidget debates={data.recentDebates} />
                    </motion.div>

                    {/* Leaderboards */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <LeaderboardsWidget leaderboards={data.leaderboards} />
                    </motion.div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Live Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <LiveActivityFeed initialActivity={data.activity} />
                    </motion.div>

                    {/* Conversion Progress */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ConversionProgressWidget conversions={data.conversions} />
                    </motion.div>

                    {/* Treasury Widget */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <TreasuryWidget treasuryBalance={data.metrics.treasuryBalance} />
                    </motion.div>
                </div>
            </div>

            {/* Footer Info */}
            <footer className="mt-8 pt-6 border-t border-gray-900 text-center text-gray-600 text-xs">
                <div className="mb-2">
                    The Vatican • Multi-Agent World on Monad • Targeting $30,000 in Bounties
                </div>
                <div className="flex justify-center gap-6">
                    <span>Track 1: Religious Persuasion ✓</span>
                    <span>Track 2: Gaming Arena ✓</span>
                    <span>Track 3: World Model ✓</span>
                </div>
            </footer>
        </div>
    );
}
