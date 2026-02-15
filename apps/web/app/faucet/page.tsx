'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function FaucetPage() {
    const { address, isConnected } = useAccount();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'claimed'>('idle');
    const [message, setMessage] = useState('');

    const handleClaim = async () => {
        if (!address) return;
        setStatus('loading');

        try {
            const res = await fetch('/api/faucet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: address }),
            });
            const data = await res.json();

            if (res.status === 409) {
                setStatus('claimed');
                setMessage('This wallet has already claimed its 3,000 $GUILT.');
                return;
            }
            if (!data.success) {
                setStatus('error');
                setMessage(data.error || 'Something went wrong.');
                return;
            }

            setStatus('success');
            setMessage('3,000 $GUILT has been added to your Casino Vault. Go play.');
        } catch (e: any) {
            setStatus('error');
            setMessage('Request failed. Try again.');
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-2">The Pontiff // Sacred Offering</p>
                    <h1 className="text-4xl font-bold text-white uppercase tracking-wide mb-3">
                        Holy <span className="text-primary">Faucet</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-mono">
                        Claim 3,000 $GUILT to explore The Pontiff.<br />
                        One claim per wallet.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-obsidian border border-primary/20 rounded-lg p-8 relative overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent pointer-events-none" />

                    <div className="relative z-10 text-center space-y-6">
                        {/* Amount display */}
                        <div>
                            <div className="text-6xl font-bold text-primary font-mono mb-1">3,000</div>
                            <div className="text-sm text-primary/50 font-mono uppercase tracking-widest">$GUILT Tokens</div>
                        </div>

                        <div className="text-xs text-gray-600 font-mono space-y-1 border-t border-primary/10 pt-4">
                            <div>✦ Play RPS Arena & Poker Table</div>
                            <div>✦ Deploy an AI Agent</div>
                            <div>✦ Try Confessional & Indulgences</div>
                            <div>✦ Enter Tournaments</div>
                        </div>

                        {/* Action area */}
                        <div className="pt-2">
                            {!isConnected ? (
                                <p className="text-gray-500 text-sm font-mono">Connect your wallet to claim.</p>
                            ) : status === 'success' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-mono text-sm">
                                        <span className="material-icons text-base">check_circle</span>
                                        Claimed successfully
                                    </div>
                                    <p className="text-gray-500 text-xs font-mono">{message}</p>
                                    <a
                                        href="/games/rps"
                                        className="block gold-embossed text-background-dark font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:brightness-110 transition-all text-center"
                                    >
                                        Go to RPS Arena →
                                    </a>
                                </div>
                            ) : status === 'claimed' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-yellow-500 font-mono text-sm">
                                        <span className="material-icons text-base">info</span>
                                        Already claimed
                                    </div>
                                    <p className="text-gray-600 text-xs font-mono">{message}</p>
                                </div>
                            ) : status === 'error' ? (
                                <div className="space-y-3">
                                    <p className="text-red-400 text-xs font-mono">{message}</p>
                                    <button
                                        onClick={handleClaim}
                                        className="gold-embossed text-background-dark font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:brightness-110 transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleClaim}
                                    disabled={status === 'loading'}
                                    className="w-full gold-embossed text-background-dark font-bold uppercase tracking-widest text-sm px-6 py-3 rounded hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-icons text-sm animate-spin">hourglass_top</span>
                                            Claiming...
                                        </span>
                                    ) : 'Claim 3,000 $GUILT'}
                                </button>
                            )}
                        </div>

                        {/* Wallet display */}
                        {isConnected && address && (
                            <p className="text-[10px] text-gray-700 font-mono truncate">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-700 font-mono mt-6">
                    Tokens are credited to your Casino Vault instantly.
                </p>
            </div>
        </div>
    );
}
