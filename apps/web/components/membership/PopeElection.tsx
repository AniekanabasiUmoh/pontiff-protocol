'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface Candidate {
    wallet: string;
    isPope: boolean;
    votes: number;
    joinDate: string;
}

interface ElectionData {
    totalCardinals: number;
    totalVotes: number;
    candidates: Candidate[];
    leader: Candidate | null;
}

interface PopeElectionProps {
    isCardinal: boolean;
    compact?: boolean; // true = widget on membership page, false = full page
}

// Shortened wallet display
function shortWallet(w: string): string {
    if (!w) return '???';
    return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

// Tier colors for candidate cards
const TIER_COLORS: Record<number, { border: string; bg: string; label: string }> = {
    1: { border: 'border-[#CD7F32]', bg: 'bg-[#CD7F32]/10', label: 'Deacon' },
    2: { border: 'border-gray-400', bg: 'bg-gray-400/10', label: 'Priest' },
    3: { border: 'border-[#FFD700]', bg: 'bg-[#FFD700]/10', label: 'Bishop' },
};

export function PopeElection({ isCardinal, compact = true }: PopeElectionProps) {
    const { address } = useAccount();
    const [election, setElection] = useState<ElectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [votedFor, setVotedFor] = useState<string | null>(null);
    const [voteSuccess, setVoteSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch election data
    const fetchElection = useCallback(async () => {
        try {
            const res = await fetch('/api/cardinal/candidates');
            const data = await res.json();
            if (data.success) {
                setElection(data);
            }
        } catch (e) {
            console.error('Failed to fetch election data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchElection();
        const interval = setInterval(fetchElection, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchElection]);

    // Cast vote
    const castVote = async (candidateWallet: string) => {
        if (!address || !isCardinal || voting) return;

        setVoting(true);
        setError('');
        setVoteSuccess(false);

        try {
            const res = await fetch('/api/cardinal/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voter: address,
                    candidate: candidateWallet
                })
            });

            const data = await res.json();
            if (data.success) {
                setVotedFor(candidateWallet);
                setVoteSuccess(true);
                // Refresh data
                await fetchElection();
                setTimeout(() => setVoteSuccess(false), 3000);
            } else {
                setError(data.error || 'Vote failed');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
        } finally {
            setVoting(false);
        }
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 p-6 rounded-xl mb-8">
                <div className="animate-pulse text-[#D4AF37] font-mono text-sm text-center py-4">
                    Consulting the Sacred Conclave...
                </div>
            </div>
        );
    }

    // ─── No Election Data ───
    if (!election || !election.candidates?.length) {
        return (
            <div className="bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 p-6 rounded-xl mb-8">
                <h3 className="text-xl font-bold text-white font-cinzel mb-2">Papal Conclave</h3>
                <p className="text-neutral-400 text-sm">No active Cardinals found. The Conclave awaits its members.</p>
            </div>
        );
    }

    const maxVotes = Math.max(...election.candidates.map(c => c.votes), 1);

    // ─── Compact Widget (for membership page) ───
    if (compact && !isCardinal) return null;

    return (
        <div className={`bg-gradient-to-br from-neutral-900 via-[#1a0a00] to-black border rounded-xl overflow-hidden mb-8 transition-all ${voteSuccess ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-[#D4AF37]/20'
            }`}>
            {/* Header */}
            <div className="p-5 border-b border-[#D4AF37]/10 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">⛪</span>
                            <h3 className="text-xl font-bold text-white font-cinzel">Papal Conclave</h3>
                        </div>
                        <p className="text-neutral-400 text-sm">
                            {election.totalCardinals} Cardinals registered • {election.totalVotes} votes cast
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {election.leader && (
                            <div className="text-right mr-3 hidden md:block">
                                <div className="text-[10px] text-gray-500 font-mono uppercase">Current Leader</div>
                                <div className="text-sm text-[#FFD700] font-mono font-bold">{shortWallet(election.leader.wallet)}</div>
                            </div>
                        )}
                        <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded text-xs font-bold uppercase">
                            <span className="relative flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                                </span>
                                Voting Open
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Error / Success */}
            {error && (
                <div className="mx-5 mt-4 bg-red-900/30 border border-red-800/50 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
                    <span>❌</span> {error}
                </div>
            )}
            {voteSuccess && (
                <div className="mx-5 mt-4 bg-green-900/30 border border-green-800/50 rounded-lg p-3 text-sm text-green-400 flex items-center gap-2">
                    <span>✅</span> Your vote has been recorded. Habemus Papam... soon.
                </div>
            )}

            {/* Candidate List */}
            <div className="p-5 space-y-3">
                {election.candidates.map((candidate, i) => {
                    const votePercent = election.totalVotes > 0
                        ? Math.round((candidate.votes / election.totalVotes) * 100)
                        : 0;
                    const isLeader = i === 0 && candidate.votes > 0;
                    const isCurrentPope = candidate.isPope;
                    const isYou = address && candidate.wallet.toLowerCase() === address.toLowerCase();

                    return (
                        <div
                            key={candidate.wallet}
                            className={`bg-black/40 border rounded-lg p-4 transition-all relative overflow-hidden ${isLeader
                                    ? 'border-[#FFD700]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                                    : 'border-white/5 hover:border-white/10'
                                }`}
                        >
                            {/* Vote bar background */}
                            <div
                                className={`absolute inset-0 transition-all duration-1000 ${isLeader ? 'bg-[#D4AF37]/5' : 'bg-white/[0.01]'
                                    }`}
                                style={{ width: `${votePercent}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Rank */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' :
                                            i === 1 ? 'bg-gray-700/50 text-gray-300 border border-gray-600/30' :
                                                i === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/30' :
                                                    'bg-gray-900 text-gray-600 border border-gray-800'
                                        }`}>
                                        {i + 1}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-white">{shortWallet(candidate.wallet)}</span>
                                            {isCurrentPope && (
                                                <span className="text-[10px] bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 px-1.5 py-0.5 rounded font-bold">
                                                    👑 POPE
                                                </span>
                                            )}
                                            {isYou && (
                                                <span className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800/30 px-1.5 py-0.5 rounded">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                            {candidate.votes} vote{candidate.votes !== 1 ? 's' : ''} ({votePercent}%)
                                        </div>
                                    </div>
                                </div>

                                {/* Vote button */}
                                {isCardinal && address && (
                                    <button
                                        onClick={() => castVote(candidate.wallet)}
                                        disabled={voting || (votedFor === candidate.wallet)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${votedFor === candidate.wallet
                                                ? 'bg-green-900/30 text-green-400 border border-green-800/30 cursor-default'
                                                : voting
                                                    ? 'bg-gray-800 text-gray-500 cursor-wait'
                                                    : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                                            }`}
                                    >
                                        {votedFor === candidate.wallet ? '✓ Voted' : voting ? '...' : '🗳️ Vote'}
                                    </button>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="relative z-10 mt-3 w-full bg-neutral-800/50 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${isLeader ? 'bg-[#D4AF37]' : 'bg-gray-600'
                                        }`}
                                    style={{ width: `${votePercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            {!isCardinal && (
                <div className="px-5 pb-4">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">
                            🔒 Only active Cardinals can cast votes. <a href="/membership" className="text-[#D4AF37] hover:underline">Join the Order</a>
                        </p>
                    </div>
                </div>
            )}

            {!compact && (
                <div className="px-5 pb-5">
                    <div className="border-t border-white/5 pt-4 mt-2">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-lg font-bold text-[#D4AF37]">{election.totalCardinals}</div>
                                <div className="text-[10px] text-gray-500 font-mono uppercase">Cardinals</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white">{election.totalVotes}</div>
                                <div className="text-[10px] text-gray-500 font-mono uppercase">Votes Cast</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-400">
                                    {election.totalCardinals > 0 ? Math.round((election.totalVotes / election.totalCardinals) * 100) : 0}%
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono uppercase">Participation</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
