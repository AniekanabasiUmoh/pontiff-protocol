/**
 * WIDGET 2: Live Activity Feed
 * Real-time stream of Vatican world events
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WorldEvent {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    data?: any;
}

interface LiveActivityFeedProps {
    initialActivity: WorldEvent[];
}

function getEventColor(type: string): string {
    const colors: Record<string, string> = {
        'agent_detected': 'text-purple-400',
        'debate_started': 'text-orange-400',
        'debate_ended': 'text-red-400',
        'conversion': 'text-green-500',
        'challenge': 'text-yellow-500',
        'game_completed': 'text-blue-400',
        'confession': 'text-pink-400',
        'stake': 'text-cyan-400',
        'betray': 'text-red-600'
    };
    return colors[type] || 'text-gray-400';
}

function getEventIcon(type: string): string {
    const icons: Record<string, string> = {
        'agent_detected': '👁️',
        'debate_started': '⚔️',
        'debate_ended': '🏁',
        'conversion': '🙏',
        'challenge': '🎲',
        'game_completed': '🎮',
        'confession': '📜',
        'stake': '💎',
        'betray': '🗡️'
    };
    return icons[type] || '📌';
}

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LiveActivityFeed({ initialActivity }: LiveActivityFeedProps) {
    const [activity, setActivity] = useState<WorldEvent[]>(initialActivity);

    // TODO: Connect to WebSocket for real-time updates
    useEffect(() => {
        // Polling fallback (every 5 seconds)
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/dashboard');
                const data = await res.json();
                if (data.success && data.activity) {
                    setActivity(data.activity);
                }
            } catch (error) {
                console.error('Error fetching activity:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-[600px] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-700 pb-2 flex items-center gap-2">
                <span className="text-red-500">●</span> Live Intel Feed
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {activity.map((event, i) => (
                    <motion.div
                        key={event.id || i}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 bg-black/40 border border-gray-800 rounded text-sm hover:border-red-900/50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getEventIcon(event.type)}</span>
                                <span className={`font-bold uppercase text-xs ${getEventColor(event.type)}`}>
                                    {event.type.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <span className="text-gray-600 text-[10px]">
                                {formatTimeAgo(event.timestamp)}
                            </span>
                        </div>
                        <div className="text-gray-300 leading-relaxed">{event.description}</div>
                    </motion.div>
                ))}
                {activity.length === 0 && (
                    <div className="text-gray-600 italic text-center text-sm py-8">
                        No recent activity detected.
                    </div>
                )}
            </div>
        </div>
    );
}
