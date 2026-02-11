'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CardinalBenefits } from '@/components/membership/CardinalBenefits';
import { PricingCard } from '@/components/membership/PricingCard';
import { SubscriptionForm } from '@/components/membership/SubscriptionForm';
import { PopeElection } from '@/components/membership/PopeElection';

const BENEFITS_QUICK = [
    { icon: 'paid', text: '3% House Edge (vs 5%)' },
    { icon: 'emoji_events', text: 'Priority Tournament Entry' },
    { icon: 'analytics', text: 'Advanced Analytics Dashboard' },
    { icon: 'how_to_vote', text: 'Governance Voting Power' },
    { icon: 'verified', text: 'Golden Profile Badge' },
];

export default function MembershipPage() {
    const { address, isConnected } = useAccount();
    const [status, setStatus] = useState<'none' | 'active' | 'expired'>('none');
    const [expiry, setExpiry] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (address) { checkStatus(); } else { setLoading(false); }
    }, [address]);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/cardinal/status?wallet=${address}`);
            const data = await res.json();
            if (data.success) { setStatus(data.status); setExpiry(data.expiresAt); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* ─── Header ─── */}
                <div className="text-center">
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-2">The Inner Circle</p>
                    <h1 className="text-4xl font-bold text-white tracking-wide uppercase mb-2">
                        Cardinal <span className="text-primary text-gold-glow">Membership</span>
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg mx-auto">
                        Ascend the hierarchy. Gain exclusive privileges, reduced fees, and governance power within the Pontiff Protocol.
                    </p>
                </div>

                {/* ─── Status Banner ─── */}
                {isConnected && !loading && (
                    <div className={`flex flex-col md:flex-row justify-between items-center gap-4 rounded-lg p-5 border ${status === 'active' ? 'bg-green-900/10 border-green-900/20' : 'bg-obsidian border-primary/15'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${status === 'active' ? 'bg-green-900/30 border border-green-800' : 'bg-primary/10 border border-primary/20'
                                }`}>
                                {status === 'active' ? '👑' : '👤'}
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Current Status</div>
                                <div className={`text-lg font-bold ${status === 'active' ? 'text-green-400' : 'text-white'}`}>
                                    {status === 'active' ? 'Cardinal' : status === 'expired' ? 'Expired Cardinal' : 'Commoner'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {status === 'active' && expiry && (
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-600 font-mono">RENEWS ON</div>
                                    <div className="text-white font-mono text-sm">{new Date(expiry).toLocaleDateString()}</div>
                                </div>
                            )}
                            {status !== 'active' && (
                                <button
                                    onClick={() => setShowPayment(true)}
                                    className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-6 py-3 rounded-lg text-xs flex items-center gap-2 hover:scale-[1.02] transition-transform"
                                >
                                    <span className="material-icons text-sm">upgrade</span>
                                    UPGRADE NOW
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Pope Election ─── */}
                <PopeElection isCardinal={status === 'active'} />

                {/* ─── Main Content ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Benefits */}
                    <div className="lg:col-span-2 space-y-6">
                        <CardinalBenefits />
                    </div>

                    {/* Right: Pricing / Payment */}
                    <div className="lg:col-span-1">
                        {showPayment ? (
                            <div className="bg-obsidian border border-primary/20 rounded-xl p-6 sticky top-24 space-y-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-icons text-primary text-sm">payment</span>
                                        Complete Purchase
                                    </h3>
                                    <button onClick={() => setShowPayment(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                                <SubscriptionForm
                                    currentStatus={status}
                                    currentExpiry={expiry || undefined}
                                    onSuccess={() => checkStatus()}
                                />
                            </div>
                        ) : (
                            <div className="bg-obsidian border border-primary/20 rounded-xl p-6 sticky top-24">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-widest mb-3">
                                        <span className="material-icons text-xs">star</span>
                                        Most Popular
                                    </div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Cardinal</h3>
                                    <div className="mt-3">
                                        <span className="text-3xl font-bold font-mono text-primary text-gold-glow">1,000</span>
                                        <span className="text-gray-500 text-sm ml-1">$GUILT / month</span>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {BENEFITS_QUICK.map((b) => (
                                        <li key={b.text} className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="material-icons text-primary text-sm">{b.icon}</span>
                                            {b.text}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => setShowPayment(true)}
                                    disabled={status === 'active'}
                                    className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${status === 'active'
                                            ? 'bg-green-900/20 text-green-400 border border-green-900/30 cursor-default'
                                            : 'gold-embossed text-background-dark hover:scale-[1.02]'
                                        }`}
                                >
                                    <span className="material-icons text-sm">{status === 'active' ? 'check_circle' : 'church'}</span>
                                    {status === 'active' ? 'ACTIVE MEMBER' : 'JOIN THE CLERGY'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
