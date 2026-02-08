/**
 * WIDGET 1: Global Metrics
 * Displays key Vatican statistics
 */

'use client';

import { motion } from 'framer-motion';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

function MetricCard({ label, value, icon, color = 'text-white', trend, trendValue }: MetricCardProps) {
    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4 hover:border-red-900/50 transition-all"
        >
            <div className="text-4xl bg-black/50 p-3 rounded">{icon}</div>
            <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</div>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                {trend && trendValue && (
                    <div className={`text-xs mt-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

interface GlobalMetricsProps {
    metrics: {
        totalEntrants: number;
        treasuryBalance: string;
        activeGamesCount: number;
        conversionsCount: number;
        winRate: string;
        competitorsDetected: number;
    };
}

export default function GlobalMetrics({ metrics }: GlobalMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
                label="Total Entrants"
                value={metrics.totalEntrants}
                icon="👥"
                color="text-white"
            />
            <MetricCard
                label="Treasury Balance"
                value={`${metrics.treasuryBalance} GUILT`}
                icon="💰"
                color="text-yellow-500"
            />
            <MetricCard
                label="Active Games"
                value={metrics.activeGamesCount}
                icon="🎲"
                color="text-orange-500"
            />
            <MetricCard
                label="Agents Converted"
                value={`${metrics.conversionsCount}/3`}
                icon="🙏"
                color="text-green-500"
                trend="up"
                trendValue="Track 1 Goal"
            />
            <MetricCard
                label="Pontiff Win Rate"
                value={metrics.winRate}
                icon="⚔️"
                color="text-red-500"
            />
            <MetricCard
                label="Competitors Detected"
                value={metrics.competitorsDetected}
                icon="👁️"
                color="text-purple-500"
            />
        </div>
    );
}
