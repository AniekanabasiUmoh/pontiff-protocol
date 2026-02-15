'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import BankModal from '../../../components/bank/BankModal';

// Playing card display helper
// Playing card display helper
function CardDisplay({ card, hidden = false, placeholder = false }: { card?: string; hidden?: boolean; placeholder?: boolean }) {
    if (placeholder) {
        return (
            <div className="w-14 h-20 lg:w-16 lg:h-24 border border-primary/10 rounded-lg bg-obsidian/50 flex items-center justify-center">
                <span className="text-primary/10 text-xs font-mono">—</span>
            </div>
        );
    }
    if (hidden) {
        return (
            <div className="w-14 h-20 lg:w-16 lg:h-24 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-obsidian flex items-center justify-center relative overflow-hidden shadow-lg group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-50" />
                <div className="absolute inset-0 bg-gold-grain opacity-30" />
                <div className="absolute inset-1 border border-primary/20 rounded-md" />
                <span className="material-icons text-primary/40 text-2xl relative z-10 group-hover:scale-110 transition-transform">auto_awesome</span>
            </div>
        );
    }

    // Parse card string (e.g., "Ah", "10s", "Kd" OR "A♥", "10♠")
    const getCardData = (cardStr: string) => {
        if (!cardStr) return { rank: '?', suit: '?', color: 'text-gray-400', suitChar: '?' };

        const lastChar = cardStr.slice(-1); // Don't lowercase yet to preserve unicode if needed
        const rank = cardStr.slice(0, -1);
        const lowerChar = lastChar.toLowerCase();

        let suit = '';
        let color = '';

        // Handle both 'h'/'d'/'s'/'c' AND '♥'/'♦'/'♠'/'♣'
        if (['h', 'd', '♥', '♦'].includes(lowerChar)) {
            color = 'text-red-600';
            if (lowerChar === 'h' || lowerChar === '♥') suit = '♥';
            else suit = '♦';
        } else if (['s', 'c', '♠', '♣'].includes(lowerChar)) {
            color = 'text-gray-900';
            if (lowerChar === 's' || lowerChar === '♠') suit = '♠';
            else suit = '♣';
        } else {
            suit = lastChar;
            color = 'text-gray-900';
        }

        return { rank, suit, color };
    };

    const { rank, suit, color } = getCardData(card || '');

    return (
        <div className={`w-14 h-20 lg:w-16 lg:h-24 rounded-lg bg-[#E8E8E8] border-2 border-gray-300 flex flex-col items-center justify-between p-1 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden`}>
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none" />

            {/* Top Left */}
            <div className={`text-[10px] lg:text-xs font-bold leading-none self-start ${color} flex flex-col items-center`}>
                <span>{rank}</span>
                <span className="-mt-0.5">{suit}</span>
            </div>

            {/* Center Suit */}
            <div className={`text-2xl lg:text-3xl ${color} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}>
                {suit}
            </div>

            {/* Bottom Right (Inverted) */}
            <div className={`text-[10px] lg:text-xs font-bold leading-none self-end ${color} flex flex-col items-center rotate-180`}>
                <span>{rank}</span>
                <span className="-mt-0.5">{suit}</span>
            </div>
        </div>
    );
}

export default function PokerPage() {
    const { address, isConnected } = useAccount();
    const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');
    const [pontiffAction, setPontiffAction] = useState<string>('');
    const [pontiffQuote, setPontiffQuote] = useState<string>('');
    const [gameId, setGameId] = useState('');
    const [playerHand, setPlayerHand] = useState<string[]>([]);
    const [pontiffHandHidden, setPontiffHandHidden] = useState<string[]>([]);
    const [communityCardsVisible, setCommunityCardsVisible] = useState<string[]>([]);
    const [pot, setPot] = useState(0);
    const [round, setRound] = useState<'PreFlop' | 'Flop' | 'Turn' | 'River'>('PreFlop');
    const [betAmount, setBetAmount] = useState(50);
    const [casinoBalance, setCasinoBalance] = useState<number>(0);
    const [serverStateToken, setServerStateToken] = useState<string>('');
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankModalTab, setBankModalTab] = useState<'deposit' | 'withdraw'>('deposit');

    // Fetch casino balance
    useEffect(() => {
        if (!address) return;
        const fetchBalance = async () => {
            try {
                const res = await fetch(`/api/bank/balance?wallet=${address}`);
                const data = await res.json();
                if (data.success) setCasinoBalance(data.available);
            } catch (err) { console.error(err); }
        };
        fetchBalance();
    }, [address, status]);

    const startGame = async () => {
        if (!address) return;
        setStatus('PLAYING');
        setPontiffQuote("Shuffling the deck of destiny...");
        try {
            const res = await fetch('/api/games/poker/deal-casino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, betAmount: betAmount.toString() })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setGameId(data.gameId);
            setPlayerHand(data.playerHand);
            setPontiffHandHidden([]);
            setCommunityCardsVisible([]);
            setPot(Number(data.pot));
            setRound('PreFlop');
            setServerStateToken(data.serverStateToken);
            setCasinoBalance(data.casinoBalance);
            setPontiffQuote("The table is set. Your move, sinner.");
        } catch (e: any) {
            setPontiffQuote(e.message || "Error dealing cards.");
            setStatus('IDLE');
        }
    };

    const handleAction = async (action: string) => {
        if (!address) return;
        if (action === 'FOLD') {
            try {
                const res = await fetch('/api/games/poker/action-casino', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, playerAction: 'FOLD', serverStateToken, round })
                });
                const data = await res.json();
                setPontiffHandHidden(data.pontiffHand || []);
                setCasinoBalance(data.casinoBalance);
                setStatus('ENDED');
                setPontiffQuote(data.message || "You folded.");
            } catch { setPontiffQuote("Error processing fold."); }
            return;
        }

        setPontiffAction("Thinking...");
        try {
            const res = await fetch('/api/games/poker/action-casino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    playerAction: action,
                    serverStateToken,
                    round,
                    raiseAmount: action === 'RAISE' ? betAmount : undefined,
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            if (data.result === 'WIN' || data.result === 'LOSS') {
                setPontiffHandHidden(data.pontiffHand || []);
                setCommunityCardsVisible(data.communityCards || []);
                setCasinoBalance(data.casinoBalance);
                setStatus('ENDED');
                setPontiffQuote(data.message);
                return;
            }

            // Continue game
            setCommunityCardsVisible(data.communityCards || []);
            setRound(data.round);
            setPot(data.pot);
            setPontiffAction(data.pontiffAction);
            setPontiffQuote(data.pontiffQuote);
            setServerStateToken(data.serverStateToken);
            setCasinoBalance(data.casinoBalance);
        } catch (e: any) {
            setPontiffQuote(e.message || "The Pontiff is silent.");
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col">
            {/* ─── Poker Header ─── */}
            <div className="p-6 lg:p-8 border-b border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-6xl mx-auto">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">
                            The Arena // Table #{gameId ? gameId.slice(0, 8) : '000'} // Blinds: 10/20
                        </p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            High Altar <span className="text-primary text-gold-glow">Poker</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="bg-obsidian border border-primary/20 rounded px-3 py-2 flex items-center gap-2">
                            <span className="text-gray-500">ROUND:</span>
                            <span className="text-primary font-bold">{status === 'PLAYING' ? round : '—'}</span>
                        </div>
                        <div className="bg-obsidian border border-primary/20 rounded px-3 py-2 flex items-center gap-2">
                            <span className="text-gray-500">FAIRNESS:</span>
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                SHA-256
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row">
                {/* ─── Main Table Area ─── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative">
                    {/* Table ambiance */}
                    <div className="absolute inset-0 bg-gradient-to-b from-green-900/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 w-full max-w-4xl space-y-8">
                        {/* ── Pontiff (Dealer) ── */}
                        <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-4">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-full bg-obsidian border-2 border-primary/30 flex items-center justify-center shadow-[0_0_25px_rgba(242,185,13,0.1)] relative group">
                                    <div className="absolute inset-[-6px] border border-primary/15 rounded-full animate-spin" style={{ animationDuration: '20s' }} />

                                    {/* Pontiff Image */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <img
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGSK7zfxpiDTgNGVZJO-fzRXQXIEVFmMT1NkVlsNDDj-_ziLk2ibDRA8OOIalNQdWN6maowg4dQhbGox2_rCFUr4Y9CnLRd8aSdoOWj2gMA5_vVGTTeNeLa_AbBnqFTBDRAOiEpNHMvz9ccRz4khbkK17aB0rbBZEphVr0RsJbSHytzwk92DP_4JuTGkOSOFyC6FNEJmiOZCl1JQlvMvrmXIMCe17jvxMY5XrJALeoBKIH21SdY-FJTJ1mHh6ITqLhu1NSttrE2pdB"
                                            alt="The Pontiff"
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-primary font-bold text-sm tracking-widest uppercase">The Pontiff</h3>
                                    <p className="text-[10px] font-mono text-gray-600">
                                        {pontiffAction ? pontiffAction : 'DEALER'}
                                    </p>
                                </div>
                            </div>
                            {/* Dealer cards */}
                            <div className="flex justify-center gap-3">
                                {status === 'ENDED' ? (
                                    pontiffHandHidden.map((c, i) => <CardDisplay key={i} card={c} />)
                                ) : status === 'PLAYING' ? (
                                    <><CardDisplay hidden /><CardDisplay hidden /></>
                                ) : null}
                            </div>
                        </div>

                        {/* ── Community Cards ── */}
                        <div className="relative py-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                <span className="text-primary/40 text-xs font-mono tracking-[0.3em]">COMMUNITY</span>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
                            </div>

                            <div className="flex justify-center gap-3 lg:gap-4 min-h-[6rem]">
                                {communityCardsVisible.map((c, i) => (
                                    <CardDisplay key={i} card={c} />
                                ))}
                                {[...Array(5 - communityCardsVisible.length)].map((_, i) => (
                                    <CardDisplay key={`p-${i}`} placeholder />
                                ))}
                            </div>

                            {/* Pot Display */}
                            <div className="text-center mt-6">
                                <div className="inline-flex items-center gap-3 bg-obsidian border border-primary/30 rounded-full px-6 py-2 shadow-[0_0_20px_rgba(242,185,13,0.1)]">
                                    <span className="material-icons text-primary text-base">toll</span>
                                    <span className="text-xl font-bold text-white font-mono">{pot}</span>
                                    <span className="text-xs text-gray-500 font-mono">$GUILT</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Player Hand ── */}
                        <div className="text-center space-y-3">
                            <div className="flex justify-center gap-3">
                                {playerHand.length > 0 ? (
                                    playerHand.map((c, i) => <CardDisplay key={i} card={c} />)
                                ) : (
                                    <><CardDisplay placeholder /><CardDisplay placeholder /></>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <span className="material-icons text-primary text-sm">person</span>
                                </div>
                                <div className="text-left">
                                    <div className="text-white text-sm font-bold flex items-center gap-2">
                                        YOU
                                        <button
                                            onClick={() => { setBankModalTab('withdraw'); setShowBankModal(true); }}
                                            className="text-[9px] text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">STACK: <span className="text-primary">{(casinoBalance || 0).toFixed(0)} $GUILT</span></div>
                                </div>
                            </div>
                        </div>

                        {/* ── Pontiff Quote ── */}
                        {pontiffQuote && (
                            <div className="max-w-xl mx-auto bg-obsidian/80 border border-primary/20 rounded-lg p-4 text-center backdrop-blur-sm">
                                <span className="text-[10px] text-primary/60 font-mono uppercase tracking-widest block mb-1">The Pontiff Speaks</span>
                                <p className="text-gray-300 text-sm italic">&ldquo;{pontiffQuote}&rdquo;</p>
                            </div>
                        )}

                        {/* ── Controls ── */}
                        <div className="max-w-xl mx-auto">
                            {status === 'IDLE' || status === 'ENDED' ? (
                                <div className="text-center">
                                    <button
                                        onClick={startGame}
                                        className="gold-embossed text-background-dark font-bold uppercase tracking-[0.2em] px-10 py-4 rounded text-base hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 mx-auto group"
                                    >
                                        <span className="material-icons text-xl group-hover:rotate-12 transition-transform">style</span>
                                        {status === 'ENDED' ? 'DEAL AGAIN' : 'DEAL HAND'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Bet Slider */}
                                    <div className="bg-obsidian border border-primary/10 rounded-lg p-4">
                                        <div className="flex justify-between text-xs font-mono text-gray-500 mb-2">
                                            <span>BET AMOUNT</span>
                                            <span className="text-primary">{betAmount} $GUILT</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={10}
                                            max={500}
                                            step={10}
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(Number(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] font-mono text-gray-600 mt-1">
                                            <span>10</span><span>250</span><span>500</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <button
                                            onClick={() => handleAction('FOLD')}
                                            className="flex flex-col items-center gap-1 py-3 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/40 hover:border-red-700 transition-all group"
                                        >
                                            <span className="material-icons text-xl">block</span>
                                            <span className="text-[10px] font-mono font-bold tracking-wider">FOLD</span>
                                        </button>
                                        <button
                                            onClick={() => handleAction('CHECK')}
                                            className="flex flex-col items-center gap-1 py-3 rounded-lg bg-blue-900/20 border border-blue-800/30 text-blue-400 hover:bg-blue-900/40 hover:border-blue-700 transition-all group"
                                        >
                                            <span className="material-icons text-xl">check_circle</span>
                                            <span className="text-[10px] font-mono font-bold tracking-wider">CHECK</span>
                                        </button>
                                        <button
                                            onClick={() => handleAction('RAISE')}
                                            className="flex flex-col items-center gap-1 py-3 rounded-lg bg-green-900/20 border border-green-800/30 text-green-400 hover:bg-green-900/40 hover:border-green-700 transition-all group"
                                        >
                                            <span className="material-icons text-xl">arrow_upward</span>
                                            <span className="text-[10px] font-mono font-bold tracking-wider">RAISE</span>
                                        </button>
                                        <button
                                            onClick={() => handleAction('ALL_IN')}
                                            className="flex flex-col items-center gap-1 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all group"
                                        >
                                            <span className="material-icons text-xl">whatshot</span>
                                            <span className="text-[10px] font-mono font-bold tracking-wider">ALL IN</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Right Sidebar: Hand History ─── */}
                <aside className="w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-primary/10 bg-obsidian/50 flex flex-col">
                    {/* Casino Balance Panel */}
                    <div className="p-4 border-b border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Casino Vault</span>
                            <span className="text-[10px] font-mono text-green-400">● LIVE</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="text-2xl font-bold text-primary font-mono">
                                {(casinoBalance || 0).toFixed(0)} <span className="text-sm text-primary/50">$GUILT</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setBankModalTab('deposit'); setShowBankModal(true); }}
                                    className="flex-1 text-[10px] font-mono uppercase font-bold text-green-400 hover:text-green-300 border border-green-900/30 bg-green-900/10 px-2 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                >
                                    <span className="material-icons text-xs">add</span>
                                    Fund
                                </button>
                                <button
                                    onClick={() => { setBankModalTab('withdraw'); setShowBankModal(true); }}
                                    className="flex-1 text-[10px] font-mono uppercase font-bold text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 px-2 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                >
                                    <span className="material-icons text-xs">remove</span>
                                    Withdraw
                                </button>
                            </div>
                            {casinoBalance === 0 && (
                                <a href="/faucet" className="text-[10px] font-mono text-primary/50 hover:text-primary transition-colors text-center">
                                    No tokens? Claim 3,000 free $GUILT →
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="p-4 border-b border-primary/10">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">history</span>
                            Hand History
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {[
                            { hand: 'A♠ K♠', result: 'WIN', desc: 'Royal Flush', amount: '+4,500', time: '5m' },
                            { hand: 'Q♥ J♥', result: 'LOSS', desc: 'Two Pair', amount: '-200', time: '12m' },
                            { hand: '7♦ 7♣', result: 'WIN', desc: 'Three of a Kind', amount: '+800', time: '20m' },
                            { hand: '10♠ 9♠', result: 'FOLD', desc: 'Pre-flop fold', amount: '-10', time: '25m' },
                            { hand: 'A♥ Q♦', result: 'WIN', desc: 'Top Pair', amount: '+350', time: '33m' },
                        ].map((h, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded border transition-colors cursor-pointer ${h.result === 'WIN' ? 'border-green-900/30 bg-green-900/5' :
                                    h.result === 'LOSS' ? 'border-red-900/30 bg-red-900/5' :
                                        'border-gray-800 bg-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-white font-mono text-sm font-bold">{h.hand}</span>
                                    <span className={`text-[10px] font-mono font-bold ${h.result === 'WIN' ? 'text-green-400' : h.result === 'LOSS' ? 'text-red-400' : 'text-gray-500'
                                        }`}>{h.result}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 font-mono">{h.desc}</span>
                                    <span className={`text-xs font-mono font-bold ${h.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                        }`}>{h.amount}</span>
                                </div>
                                <div className="text-[9px] text-gray-600 font-mono mt-1">{h.time} ago</div>
                            </div>
                        ))}
                    </div>

                    {/* Session Stats */}
                    <div className="p-4 border-t border-primary/10 bg-obsidian">
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                                <div className="text-lg font-bold text-primary font-mono">+5,440</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Session P&L</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white font-mono">23</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Hands Played</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <BankModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} initialTab={bankModalTab} />
        </div>
    );
}
