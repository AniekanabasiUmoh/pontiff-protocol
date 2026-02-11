'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentConfigModal } from '@/components/modals/AgentConfigModal';

const AGENTS = [
    {
        id: 'berzerker',
        name: 'The Berzerker',
        icon: '⚔️',
        archetype: 'Aggressor',
        description: 'Maximizes volatility. Aggressive betting, all-in tendencies. High risk, high reward. Built for the fearless.',
        stats: { winRate: '68%', avgReturn: '+142%', risk: 'EXTREME', games: 'Poker, RPS' },
        traits: ['All-in tendency', 'Bluff detection', 'Pattern breaker', 'Tilt immunity'],
        color: 'from-red-900/30 to-red-950/10',
        borderColor: 'border-red-800/30 hover:border-red-600/50',
        accentColor: 'text-red-400',
        bgAccent: 'bg-red-900/10',
    },
    {
        id: 'merchant',
        name: 'The Merchant',
        icon: '💰',
        archetype: 'Calculator',
        description: 'Pattern-recognizing profit seeker. Calculates expected value for every decision. Slow, methodical, deadly.',
        stats: { winRate: '55%', avgReturn: '+64%', risk: 'MEDIUM', games: 'Poker, Judas' },
        traits: ['EV optimization', 'Bankroll management', 'Statistical modeling', 'Risk hedging'],
        color: 'from-primary/20 to-primary/5',
        borderColor: 'border-primary/30 hover:border-primary/60',
        accentColor: 'text-primary',
        bgAccent: 'bg-primary/10',
        featured: true,
    },
    {
        id: 'disciple',
        name: 'The Disciple',
        icon: '🙏',
        archetype: 'Preserver',
        description: 'Capital preservation above all. Conservative staking, compounding yield. The tortoise wins the race.',
        stats: { winRate: '42%', avgReturn: '+28%', risk: 'LOW', games: 'Staking, RPS' },
        traits: ['Capital preservation', 'Yield compounding', 'Auto-rebalancing', 'Loss prevention'],
        color: 'from-blue-900/20 to-blue-950/10',
        borderColor: 'border-blue-800/30 hover:border-blue-600/50',
        accentColor: 'text-blue-400',
        bgAccent: 'bg-blue-900/10',
    },
];

function HirePageContent() {
    const searchParams = useSearchParams();
    const agentId = searchParams.get('agent');

    const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);

    useEffect(() => {
        if (agentId) {
            const found = AGENTS.find(a => a.id === agentId);
            if (found) setSelectedAgent(found);
        }
    }, [agentId]);

    const handleClose = () => {
        setSelectedAgent(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('agent');
        window.history.pushState({}, '', url);
    };

    return (
        <>
            {/* ─── Agent Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {AGENTS.map((agent) => (
                    <div
                        key={agent.id}
                        className={`relative bg-obsidian rounded-xl border overflow-hidden transition-all duration-300 group hover:-translate-y-1 flex flex-col cursor-pointer ${agent.borderColor}`}
                        onClick={() => setSelectedAgent(agent)}
                    >
                        {/* Featured badge */}
                        {agent.featured && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                        )}

                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                        {/* Content */}
                        <div className="relative z-10 p-6 flex-1">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-xl ${agent.bgAccent} border border-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                                    {agent.icon}
                                </div>
                                <div>
                                    <div className={`text-[10px] font-mono ${agent.accentColor} uppercase tracking-widest`}>{agent.archetype}</div>
                                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mb-5 leading-relaxed">{agent.description}</p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {[
                                    { label: 'Win Rate', value: agent.stats.winRate },
                                    { label: 'Avg Return', value: agent.stats.avgReturn },
                                    { label: 'Risk', value: agent.stats.risk },
                                    { label: 'Games', value: agent.stats.games },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-background-dark rounded-lg p-2 border border-white/5">
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">{stat.label}</div>
                                        <div className={`text-xs font-mono font-bold ${stat.label === 'Risk' ? (
                                            stat.value === 'EXTREME' ? 'text-red-400' : stat.value === 'MEDIUM' ? 'text-primary' : 'text-blue-400'
                                        ) : 'text-white'}`}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Traits */}
                            <div className="flex flex-wrap gap-1.5">
                                {agent.traits.map((trait) => (
                                    <span key={trait} className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="relative z-10 p-6 pt-0">
                            <button className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${agent.featured
                                    ? 'gold-embossed text-background-dark hover:scale-[1.02]'
                                    : `${agent.bgAccent} ${agent.accentColor} border border-current/20 hover:scale-[1.02]`
                                }`}>
                                <span className="material-icons text-sm">smart_toy</span>
                                CONFIGURE & HIRE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Bottom Info ─── */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: 'security', title: 'Session Wallets', desc: 'Agents operate from isolated session wallets. Your main wallet is never at risk.' },
                    { icon: 'trending_up', title: 'Autonomous Play', desc: 'Once deployed, agents play 24/7 without intervention. Track via the dashboard.' },
                    { icon: 'account_balance', title: 'Withdraw Anytime', desc: 'Stop your agent and withdraw remaining funds at any time. No lock-ups.' },
                ].map((info) => (
                    <div key={info.title} className="bg-obsidian border border-primary/10 rounded-lg p-5 flex gap-4 group hover:border-primary/20 transition-colors">
                        <span className="material-icons text-primary/50 text-xl group-hover:text-primary/80 transition-colors">{info.icon}</span>
                        <div>
                            <div className="text-sm text-white font-bold mb-1">{info.title}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{info.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAgent && (
                <AgentConfigModal
                    isOpen={!!selectedAgent}
                    onClose={handleClose}
                    agent={selectedAgent}
                />
            )}
        </>
    );
}

export default function HirePage() {
    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Agent Protocol // Recruitment_Bay</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-2">
                        Summon Your <span className="text-primary text-gold-glow">Agent</span>
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Choose an archetype, fund their session wallet, and unleash them upon the protocol. They will autonomously play, wager, and report back to you.
                    </p>
                </div>

                <Suspense fallback={<div className="text-center text-primary font-mono animate-pulse py-20">Scanning available agents...</div>}>
                    <HirePageContent />
                </Suspense>
            </div>
        </div>
    );
}
