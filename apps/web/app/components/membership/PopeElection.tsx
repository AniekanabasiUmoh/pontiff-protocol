'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CandidateCard } from './CandidateCard';

interface Candidate {
    wallet: string;
    isPope: boolean;
    votes: number;
    joinDate: string;
}

export function PopeElection({ isCardinal }: { isCardinal: boolean }) {
    const { address } = useAccount();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingFor, setVotingFor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/api/cardinal/candidates');
            const data = await res.json();
            if (data.success) {
                setCandidates(data.candidates || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidateWallet: string) => {
        if (!isCardinal) return;
        setVotingFor(candidateWallet);
        setError(null);

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

            if (!res.ok) {
                throw new Error(data.error || 'Failed to cast vote');
            }

            // Refresh candidates to show new vote count
            await fetchCandidates();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setVotingFor(null);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-neutral-500 animate-pulse">Loading Conclave...</div>;
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 mb-12">
            <div className="text-center mb-8">
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 block">
                    The Holy See
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white font-cinzel mb-4">
                    Papal Election
                </h2>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                    Cardinals elect the Pope from within their own ranks. The Pope wields supreme authority over protocol parameters.
                </p>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded mb-6 text-center text-sm">
                    ⚠️ {error}
                </div>
            )}

            {!isCardinal && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 text-yellow-200 p-4 rounded mb-8 text-center text-sm">
                    🔒 Only Cardinals may cast votes in the election. Join the inner circle to participate.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {candidates.map((candidate) => (
                    <CandidateCard
                        key={candidate.wallet}
                        candidate={candidate}
                        onVote={handleVote}
                        canVote={isCardinal}
                        isVoting={votingFor === candidate.wallet}
                    />
                ))}

                {candidates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-neutral-500 italic">
                        No active Cardinals found. The seat is empty.
                    </div>
                )}
            </div>
        </div>
    );
}
