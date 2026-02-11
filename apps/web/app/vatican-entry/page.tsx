'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';

export default function VaticanEntryPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [hasAccepted, setHasAccepted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    /* ─── Not Connected: Gate Screen ─── */
    if (!isMounted || !isConnected) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(242,185,13,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(242,185,13,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,185,13,0.08)_0%,transparent_60%)] pointer-events-none" />

                <div className="relative z-10 max-w-xl w-full mx-4">
                    {/* Seal */}
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center shadow-[0_0_40px_rgba(242,185,13,0.3)] ring-4 ring-black">
                            <span className="text-4xl">⛪</span>
                        </div>
                    </div>

                    <div className="bg-obsidian border border-primary/30 p-10 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        {/* Corner decorations */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />

                        <p className="text-[10px] font-mono text-primary/60 tracking-[0.3em] uppercase mb-4">The Pontiff Protocol</p>
                        <h1 className="text-4xl font-bold mb-3 uppercase tracking-wide">
                            The <span className="text-primary text-gold-glow">Vatican</span> Gate
                        </h1>
                        <p className="text-sm text-gray-400 font-mono mb-8 max-w-sm mx-auto">
                            Enter the sacred realm where guilt is currency and the Pontiff judges all.
                        </p>

                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>

                        <div className="h-px w-48 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto mt-8" />
                        <p className="text-[10px] text-gray-600 font-mono mt-4">SECURE_CONNECTION // MONAD_TESTNET</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Connected: Acceptance Screen ─── */
    if (!hasAccepted) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(242,185,13,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242,185,13,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 max-w-2xl w-full mx-4">
                    <div className="bg-obsidian border border-primary/30 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        {/* Top gold bar */}
                        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                        {/* Header */}
                        <div className="text-center p-8 pb-6 border-b border-primary/10">
                            <span className="text-5xl mb-4 block">🙏</span>
                            <p className="text-[10px] font-mono text-primary/60 tracking-[0.3em] uppercase mb-2">Initiation Rite</p>
                            <h2 className="text-3xl font-bold uppercase tracking-wide">
                                Welcome to the <span className="text-primary text-gold-glow">Vatican</span>
                            </h2>
                            <p className="text-sm text-gray-500 font-mono mt-2">
                                You stand at the threshold of The Pontiff Protocol
                            </p>
                        </div>

                        {/* Info panels */}
                        <div className="p-8 space-y-4">
                            <div className="bg-black/60 border border-gray-800 p-5 rounded">
                                <h3 className="text-xs font-mono text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span>⚔️</span> What Awaits You
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-400 font-mono">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">›</span>
                                        <span><strong className="text-white">Confess Your Sins</strong> — Let the AI judge your wallet</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">›</span>
                                        <span><strong className="text-white">Stake $GUILT</strong> — Earn absolution through penance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">›</span>
                                        <span><strong className="text-white">Wage Holy Wars</strong> — RPS, Poker, and Judas Protocol</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">›</span>
                                        <span><strong className="text-white">Deploy Agents</strong> — Autonomous gambling warriors</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">›</span>
                                        <span><strong className="text-white">Join Crusades</strong> — Collaborative missions against heretics</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-black/60 border border-gray-800 p-5 rounded">
                                <h3 className="text-xs font-mono text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span>💰</span> The Economy
                                </h3>
                                <p className="text-sm text-gray-400 font-mono leading-relaxed">
                                    Earn <strong className="text-primary">$GUILT</strong> through games, stakes, and conquests.
                                    Use it to stake, gamble, purchase indulgences, or ascend to <strong className="text-primary">Cardinal</strong> status.
                                </p>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 p-4 rounded">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 w-5 h-5 cursor-pointer accent-primary bg-black border-primary/30"
                                    onChange={(e) => setHasAccepted(e.target.checked)}
                                />
                                <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer font-mono leading-relaxed">
                                    I understand that I enter the Vatican World at my own risk. The Pontiff&apos;s judgment is final,
                                    and all wagers are binding under the sacred laws of the blockchain.
                                </label>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => router.push('/dashboard')}
                                disabled={!hasAccepted}
                                className="w-full bg-primary hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-4 text-lg uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(242,185,13,0.3)] hover:shadow-[0_0_30px_rgba(242,185,13,0.5)] relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    ⛪ Enter the Vatican
                                </span>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 border-t border-primary/10 bg-black/40 text-center">
                            <p className="text-[10px] text-gray-600 font-mono">
                                Connected as: <span className="text-primary/60">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                                {' '} • MONAD_TESTNET
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Redirecting ─── */
    router.push('/dashboard');

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(242,185,13,0.3)]" />
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Entering the Vatican...</p>
            </div>
        </div>
    );
}
