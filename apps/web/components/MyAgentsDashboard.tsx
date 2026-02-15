'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

interface AgentSession {
    id: string;
    user_wallet: string;
    strategy: string;
    agent_mode: string;
    status: string;
    current_balance: number;
    starting_balance: number;
    profit_loss: string;
    games_played: number;
    total_wins: number;
    total_losses: number;
    pvp_wins: number;
    pvp_losses: number;
    pvp_draws: number;
    elo_rating: number;
    pvp_earnings: number;
    created_at: string;
}

const STRATEGY_ICONS: Record<string, string> = {
    berzerker: '⚔️',
    merchant: '💰',
    disciple: '🙏'
};

const MODE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    PvE: { label: 'Grind House', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/30' },
    PvP_Any: { label: 'Gladiator', color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/30' },
    PvP_Target: { label: 'Hunter', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/30' }
};

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
    active: { dot: 'bg-green-500', label: 'ACTIVE' },
    searching: { dot: 'bg-yellow-500 animate-pulse', label: 'SEARCHING' },
    fighting: { dot: 'bg-red-500 animate-pulse', label: 'IN BATTLE' },
    stopped: { dot: 'bg-gray-500', label: 'STOPPED' },
    expired: { dot: 'bg-gray-700', label: 'EXPIRED' }
};

export function MyAgentsDashboard({ walletAddress }: { walletAddress?: string }) {
    const [agents, setAgents] = useState<AgentSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        if (!walletAddress) {
            setLoading(false);
            return;
        }

        const fetchAgents = async () => {
            try {
                const res = await fetch(`/api/agents/sessions?wallet=${walletAddress}`);
                const data = await res.json();
                if (data.sessions) {
                    setAgents(data.sessions);
                }
            } catch (e) {
                console.error('Failed to fetch agent sessions:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, [walletAddress]);

    // Real-time Subscription
    useEffect(() => {
        if (!walletAddress) return;

        const channel = supabase
            .channel('dashboard-agents')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'agent_sessions',
                    filter: `user_wallet=eq.${walletAddress}`
                },
                (payload) => {
                    setAgents((prev) => prev.map(agent =>
                        agent.id === payload.new.id ? { ...agent, ...payload.new } : agent
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'agent_sessions',
                    filter: `user_wallet=eq.${walletAddress}`
                },
                (payload) => {
                    setAgents((prev) => [payload.new as AgentSession, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [walletAddress]);

    if (loading) {
        return (
            <div className="bg-obsidian border border-primary/10 rounded-xl p-8 text-center">
                <div className="animate-pulse text-primary font-mono text-sm">Loading your agents...</div>
            </div>
        );
    }

    if (!walletAddress) {
        return (
            <div className="bg-obsidian border border-primary/10 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">Connect your wallet to view your agents</p>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="bg-obsidian border border-primary/10 rounded-xl p-8 text-center">
                <span className="text-3xl mb-3 block">🤖</span>
                <p className="text-gray-400 text-sm mb-2">No agents deployed yet</p>
                <p className="text-gray-600 text-xs">Choose an archetype above and spawn your first agent</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                    <span>🤖</span> My Agents
                    <span className="text-xs font-normal text-gray-500">({agents.length})</span>
                </h3>
            </div>

            <div className="space-y-3">
                {agents.map((agent) => {
                    const pnl = parseFloat(agent.profit_loss || '0');
                    const pnlColor = pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400';
                    const mode = MODE_LABELS[agent.agent_mode] || MODE_LABELS.PvE;

                    // Handle pending_funding status specifically
                    let statusStyle = STATUS_STYLES[agent.status];
                    if (agent.status === 'pending_funding') {
                        statusStyle = { dot: 'bg-yellow-500 animate-pulse', label: 'WAITING FOR FUNDS' };
                    } else if (!statusStyle) {
                        statusStyle = STATUS_STYLES.stopped;
                    }

                    const isPvP = agent.agent_mode !== 'PvE';

                    return (
                        <div
                            key={agent.id}
                            className="bg-obsidian border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all group"
                        >
                            {/* Top row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{STRATEGY_ICONS[agent.strategy] || '🤖'}</span>
                                    <div>
                                        <div className="text-sm font-mono text-white">
                                            {agent.strategy?.charAt(0).toUpperCase() + agent.strategy?.slice(1)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {/* Status dot */}
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                            <span className="text-[10px] font-mono text-gray-500">{statusStyle.label}</span>

                                            {/* Mode badge */}
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${mode.bg} ${mode.color}`}>
                                                {mode.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* P&L */}
                                <div className="text-right">
                                    <div className={`text-lg font-mono font-bold ${pnlColor}`}>
                                        {pnl > 0 ? '+' : ''}{pnl.toFixed(1)}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">GUILT P&L</div>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-background-dark rounded p-2 border border-white/5">
                                    <div className="text-[9px] text-gray-600 font-mono uppercase">Balance</div>
                                    <div className="text-xs font-mono text-white">{agent.current_balance?.toFixed(1)}</div>
                                </div>
                                <div className="bg-background-dark rounded p-2 border border-white/5">
                                    <div className="text-[9px] text-gray-600 font-mono uppercase">Games</div>
                                    <div className="text-xs font-mono text-white">{agent.games_played || 0}</div>
                                </div>
                                <div className="bg-background-dark rounded p-2 border border-white/5">
                                    <div className="text-[9px] text-gray-600 font-mono uppercase">W/L</div>
                                    <div className="text-xs font-mono text-white">
                                        {isPvP
                                            ? `${agent.pvp_wins || 0}/${agent.pvp_losses || 0}`
                                            : `${agent.total_wins || 0}/${agent.total_losses || 0}`
                                        }
                                    </div>
                                </div>
                                <div className="bg-background-dark rounded p-2 border border-white/5">
                                    <div className="text-[9px] text-gray-600 font-mono uppercase">
                                        {isPvP ? 'ELO' : 'Win Rate'}
                                    </div>
                                    <div className="text-xs font-mono text-white">
                                        {isPvP
                                            ? agent.elo_rating || 1000
                                            : agent.games_played > 0
                                                ? `${Math.round((agent.total_wins / agent.games_played) * 100)}%`
                                                : '—'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {agent.status === 'active' && (
                                <div className="flex gap-2 mt-3">
                                    {isPvP && (
                                        <a
                                            href={`/arena`}
                                            className="flex-1 py-1.5 rounded bg-red-900/20 border border-red-800/30 text-red-400 text-[10px] font-mono text-center uppercase hover:bg-red-900/30 transition-colors"
                                        >
                                            👁️ Spectate
                                        </a>
                                    )}
                                    <button className="flex-1 py-1.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono text-center uppercase hover:bg-white/10 transition-colors">
                                        ⏹ Stop Agent
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
