/**
 * WIDGET 4: Recent Debates
 * Shows active theological debates
 */

'use client';

import Link from 'next/link';

interface Debate {
    id: string;
    competitor: {
        name: string;
        twitter_handle: string;
        threat_level: string;
    } | null;
    exchanges: number;
    lastExchange: string;
}

interface RecentDebatesWidgetProps {
    debates: Debate[];
}

function getThreatColor(level: string): string {
    const colors: Record<string, string> = {
        'HIGH': 'text-red-500',
        'MEDIUM': 'text-orange-500',
        'LOW': 'text-green-500'
    };
    return colors[level] || 'text-gray-500';
}

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);

    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
}

export default function RecentDebatesWidget({ debates }: RecentDebatesWidgetProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-300">Active Debates</h2>
                <Link
                    href="/debates"
                    className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                    View All →
                </Link>
            </div>
            <div className="space-y-3">
                {debates.map((debate) => (
                    <div
                        key={debate.id}
                        className="bg-black/50 p-3 rounded border border-gray-800 hover:border-red-900/50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <div className="text-purple-400 font-bold text-sm">
                                    {debate.competitor?.name || 'Unknown'}
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                    @{debate.competitor?.twitter_handle || 'unknown'}
                                </div>
                            </div>
                            <div className={`text-xs font-bold ${getThreatColor(debate.competitor?.threat_level || 'LOW')}`}>
                                {debate.competitor?.threat_level || 'LOW'}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                            <span className="text-gray-400 text-xs">
                                {debate.exchanges} exchanges
                            </span>
                            <span className="text-gray-600 text-xs">
                                {formatTimeAgo(debate.lastExchange)}
                            </span>
                        </div>
                    </div>
                ))}
                {debates.length === 0 && (
                    <div className="text-center text-gray-600 italic py-8 text-sm">
                        No active debates. Peace reigns... for now.
                    </div>
                )}
            </div>
        </div>
    );
}
