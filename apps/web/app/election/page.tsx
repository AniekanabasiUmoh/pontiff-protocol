'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PopeElection } from '@/components/membership/PopeElection';

interface ElectionStatus {
    status: string;
    currentPope: { wallet: string; tier: number } | null;
    leader: { wallet: string; votes: number } | null;
    totalCardinals: number;
    totalVotes: number;
    participationRate: number;
    quorum: number;
    hasQuorum: boolean;
    termEnd: string;
    daysRemaining: number;
}

function shortAddr(w: string): string {
    return w ? `${w.slice(0, 6)}...${w.slice(-4)}` : '—';
}

export default function ElectionPage() {
    const { address, isConnected } = useAccount();
    const [electionStatus, setElectionStatus] = useState<ElectionStatus | null>(null);
    const [isCardinal, setIsCardinal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch election status
        fetch('/api/cardinal/election/status')
            .then(r => r.json())
            .then(d => {
                if (d.election) setElectionStatus(d.election);
            })
            .catch(() => { });

        // Check if user is a cardinal
        if (address) {
            fetch(`/api/cardinal/status?wallet=${address}`)
                .then(r => r.json())
                .then(d => {
                    setIsCardinal(d.isCardinal || false);
                })
                .catch(() => { });
        }

        setLoading(false);
    }, [address]);

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] font-mono text-[#D4AF37]/50 tracking-[0.3em] uppercase mb-2">
                        Pontifical Protocol // Sacred_Conclave
                    </p>
                    <h1 className="text-4xl font-bold text-white font-cinzel mb-3">
                        Papal <span className="text-[#D4AF37]">Election</span>
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg mx-auto">
                        The College of Cardinals elects the Pontiff. Only active Cardinals may cast their sacred vote.
                        Election resets on the 1st of each month.
                    </p>
                </div>

                {/* Election Status Bar */}
                {electionStatus && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                        {/* Current Pope */}
                        <div className="bg-obsidian border border-[#D4AF37]/20 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                            <div className="text-2xl mb-1">👑</div>
                            <div className="text-sm font-mono text-[#FFD700] font-bold">
                                {electionStatus.currentPope ? shortAddr(electionStatus.currentPope.wallet) : 'Sede Vacante'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">Current Pope</div>
                        </div>

                        {/* Cardinals */}
                        <div className="bg-obsidian border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-xl font-bold text-white">{electionStatus.totalCardinals}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">Cardinals</div>
                        </div>

                        {/* Votes Cast */}
                        <div className="bg-obsidian border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-xl font-bold text-white">{electionStatus.totalVotes}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">Votes Cast</div>
                        </div>

                        {/* Participation */}
                        <div className="bg-obsidian border border-white/5 rounded-xl p-4 text-center">
                            <div className={`text-xl font-bold ${electionStatus.participationRate > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {electionStatus.participationRate}%
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">Participation</div>
                        </div>

                        {/* Days Remaining */}
                        <div className="bg-obsidian border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-xl font-bold text-red-400">{electionStatus.daysRemaining}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">Days Left</div>
                        </div>
                    </div>
                )}

                {/* Quorum Status */}
                {electionStatus && (
                    <div className={`mb-8 p-4 rounded-xl border text-center ${electionStatus.hasQuorum
                            ? 'bg-green-900/10 border-green-800/30'
                            : 'bg-yellow-900/10 border-yellow-800/30'
                        }`}>
                        <div className="flex items-center justify-center gap-2">
                            <span className={electionStatus.hasQuorum ? 'text-green-400' : 'text-yellow-400 animate-pulse'}>
                                {electionStatus.hasQuorum ? '✅' : '⏳'}
                            </span>
                            <span className={`text-sm font-mono ${electionStatus.hasQuorum ? 'text-green-400' : 'text-yellow-400'}`}>
                                {electionStatus.hasQuorum
                                    ? `Quorum reached (${electionStatus.totalVotes}/${electionStatus.quorum} required). Election is valid.`
                                    : `Quorum not yet reached (${electionStatus.totalVotes}/${electionStatus.quorum} needed). More votes required.`
                                }
                            </span>
                        </div>
                    </div>
                )}

                {/* Not Connected Warning */}
                {!isConnected && (
                    <div className="mb-8 bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 text-center">
                        <span className="text-2xl block mb-2">🔐</span>
                        <p className="text-sm text-gray-400 mb-1">Connect your wallet to participate</p>
                        <p className="text-xs text-gray-600">Only active Cardinals can vote in the Papal Election</p>
                    </div>
                )}

                {/* Election Component */}
                <PopeElection isCardinal={isCardinal} compact={false} />

                {/* How It Works */}
                <div className="mt-10 bg-obsidian border border-white/5 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>📜</span> How the Conclave Works
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                step: '1',
                                title: 'Join as Cardinal',
                                desc: 'Subscribe to Cardinal membership to earn voting rights in the Sacred Conclave.',
                                icon: '⛪'
                            },
                            {
                                step: '2',
                                title: 'Cast Your Vote',
                                desc: 'Vote for any active Cardinal. You may change your vote at any time during the term.',
                                icon: '🗳️'
                            },
                            {
                                step: '3',
                                title: 'Habemus Papam',
                                desc: 'When quorum is reached, the leading candidate becomes the new Pontiff on the 1st of next month.',
                                icon: '👑'
                            },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white mb-1 flex items-center gap-1">
                                        <span>{item.icon}</span> {item.title}
                                    </div>
                                    <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
