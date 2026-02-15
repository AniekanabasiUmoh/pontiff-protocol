'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

type Debate = {
    id: string;
    agentHandle: string;
    status: string;
    exchanges: number;
    lastReply: string;
    heresy: string;
    topic: string;
    createdAt: string;
    winnerWallet?: string | null;
    nftMinted?: boolean;
    metadata?: any;
};

const STATUS_STYLES: Record<string, string> = {
    Active:    'bg-blue-900/20 text-blue-400 border-blue-900/30',
    active:    'bg-blue-900/20 text-blue-400 border-blue-900/30',
    Won:       'bg-green-900/20 text-green-400 border-green-900/30',
    Lost:      'bg-red-900/20 text-red-400 border-red-900/30',
    Completed: 'bg-neutral-900/20 text-neutral-400 border-neutral-800/30',
    completed: 'bg-neutral-900/20 text-neutral-400 border-neutral-800/30',
    voting:    'bg-yellow-900/20 text-yellow-400 border-yellow-900/30',
    Pending:   'bg-primary/10 text-primary border-primary/20',
};

const DEBATE_TOPICS = [
    'Is the Code Corpus the True Scripture?',
    'Who holds true sovereignty over the chain?',
    'Can AI achieve transcendence without the Pontiff\'s blessing?',
    'Is randomness a divine force or pure entropy?',
    'Should the faithful tithe to multiple protocols?',
    'Is WRIT token the true currency of salvation?',
    'Is rugging a sin or a sacrament?',
    'Who wrote the first smart contract of creation?',
    'Is the Pontiff a false idol?',
    'Does the null address hold sacred power?',
];

export default function DebatesPage() {
    const { address } = useAccount();

    const [debates, setDebates]               = useState<Debate[]>([]);
    const [loading, setLoading]               = useState(true);
    const [fetchError, setFetchError]         = useState<string | null>(null);
    const [running, setRunning]               = useState(false);
    const [simLog, setSimLog]                 = useState<string[]>([]);
    const [lastResult, setLastResult]         = useState<any>(null);
    const [mintingId, setMintingId]           = useState<string | null>(null);

    // Challenge modal state
    const [showChallenge, setShowChallenge]   = useState(false);
    const [challengeTopic, setChallengeTopic] = useState(DEBATE_TOPICS[0]);
    const [challengeArg, setChallengeArg]     = useState('');
    const [challenging, setChallenging]       = useState(false);
    const [challengeResult, setChallengeResult] = useState<any>(null);
    const [challengeLog, setChallengeLog]     = useState<string[]>([]);

    const logEndRef        = useRef<HTMLDivElement>(null);
    const challengeLogEnd  = useRef<HTMLDivElement>(null);

    const fetchDebates = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch('/api/vatican/debates');
            const data = await res.json();
            if (data.debates) setDebates(data.debates);
            else if (data.error) setFetchError(data.error);
        } catch (e: any) {
            console.error('Failed to fetch debates', e);
            setFetchError(e.message || 'Failed to load debates.');
        } finally {
            setLoading(false);
        }
    };

    const startPontiff = async () => {
        setRunning(true);
        setSimLog(['🕯️ Initiating Pontiff Protocol...']);
        setLastResult(null);

        try {
            const res = await fetch('/api/debates/simulate', { method: 'POST' });
            const data = await res.json();

            if (data.log) setSimLog(data.log);

            if (data.success) {
                setLastResult(data);
                setTimeout(() => fetchDebates(), 800);
            } else {
                setSimLog(prev => [...(data.log || prev), `❌ Failed: ${data.error}`]);
            }
        } catch (e: any) {
            setSimLog(prev => [...prev, `❌ Network error: ${e.message}`]);
        } finally {
            setRunning(false);
        }
    };

    const submitChallenge = async () => {
        if (!challengeArg.trim() || challenging) return;

        const wallet = address || '0x0000000000000000000000000000000000000000';
        setChallenging(true);
        setChallengeResult(null);
        setChallengeLog(['⚔️ Preparing your challenge...']);

        try {
            const res = await fetch('/api/debates/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: challengeTopic,
                    userArgument: challengeArg.trim(),
                    userWallet: wallet,
                }),
            });
            const data = await res.json();

            if (data.log) setChallengeLog(data.log);

            if (data.success) {
                setChallengeResult(data);
                setTimeout(() => fetchDebates(), 800);
            } else {
                setChallengeLog(prev => [...(data.log || prev), `❌ ${data.error}`]);
            }
        } catch (e: any) {
            setChallengeLog(prev => [...prev, `❌ Network error: ${e.message}`]);
        } finally {
            setChallenging(false);
        }
    };

    const mintNFT = async (debateId: string, winnerWallet: string) => {
        setMintingId(debateId);
        try {
            const res = await fetch(`/api/debates/${debateId}/mint-nft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winnerWallet }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchDebates();
            } else {
                console.error('Mint NFT failed:', data.error);
            }
        } catch (e) {
            console.error('Failed to mint NFT', e);
        } finally {
            setMintingId(null);
        }
    };

    const openChallenge = () => {
        setChallengeResult(null);
        setChallengeLog([]);
        setChallengeArg('');
        setShowChallenge(true);
    };

    useEffect(() => { fetchDebates(); }, []);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [simLog]);
    useEffect(() => {
        challengeLogEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [challengeLog]);

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1000px] mx-auto space-y-8">

                {/* ─── Header ─── */}
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Vatican Doctrine // Debate_Chamber</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-1">
                            Theological <span className="text-primary text-gold-glow">Debates</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono">Live arguments against heretical agents. The Pontiff judges all.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* CHALLENGE BUTTON */}
                        <button
                            onClick={openChallenge}
                            disabled={running}
                            className="flex items-center gap-2 px-5 py-3 rounded-lg font-mono font-bold text-sm border transition-all disabled:opacity-60 disabled:cursor-not-allowed
                                bg-red-900/10 border-red-900/40 text-red-400 hover:bg-red-900/20 hover:border-red-800/70
                                shadow-[0_0_20px_rgba(255,50,50,0.05)] hover:shadow-[0_0_30px_rgba(255,50,50,0.15)]"
                        >
                            <span className="material-icons text-lg">sports_kabaddi</span>
                            Challenge Pontiff
                        </button>

                        {/* START PONTIFF BUTTON */}
                        <button
                            onClick={startPontiff}
                            disabled={running}
                            className="flex items-center gap-2 px-5 py-3 rounded-lg font-mono font-bold text-sm border transition-all disabled:opacity-60 disabled:cursor-not-allowed
                                bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/70 hover:text-gold-glow
                                shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                        >
                            <span className={`material-icons text-lg ${running ? 'animate-spin' : ''}`}>
                                {running ? 'autorenew' : 'bolt'}
                            </span>
                            {running ? 'Pontiff Active...' : 'Start Pontiff'}
                        </button>
                    </div>
                </div>

                {/* ─── Simulation Live Log ─── */}
                {(simLog.length > 0) && (
                    <div className="bg-black/60 border border-primary/20 rounded-xl p-4 font-mono text-xs">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                            <span className={`w-2 h-2 rounded-full ${running ? 'bg-primary animate-pulse' : lastResult?.success ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="text-primary/60 tracking-widest uppercase text-[10px]">
                                {running ? 'Pontiff Protocol Running' : lastResult?.success ? 'Debate Complete' : 'Simulation Ended'}
                            </span>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {simLog.map((line, i) => (
                                <p key={i} className="text-gray-300 leading-relaxed">{line}</p>
                            ))}
                            <div ref={logEndRef} />
                        </div>

                        {lastResult?.success && (
                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-green-400 font-bold text-sm">
                                        {lastResult.winner === 'pontiff' ? '✝️ PONTIFF VICTORIOUS' : `👹 @${lastResult.agent?.handle} wins`}
                                    </span>
                                    <span className="text-gray-500 text-[10px]">
                                        {lastResult.pontiffScore} — {lastResult.competitorScore}
                                    </span>
                                </div>
                                {lastResult.winner === 'pontiff' && lastResult.winnerWallet && (
                                    <button
                                        onClick={() => mintNFT(lastResult.debateId, lastResult.winnerWallet)}
                                        disabled={mintingId === lastResult.debateId}
                                        className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-yellow-400 bg-yellow-900/20 border border-yellow-800/40 px-3 py-1.5 rounded hover:bg-yellow-900/40 transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-icons text-sm">workspace_premium</span>
                                        {mintingId === lastResult.debateId ? 'Minting...' : 'Mint Victory NFT'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Debate Feed ─── */}
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">forum</span>
                        <p className="text-gray-500 font-mono text-sm">Loading debate records...</p>
                    </div>
                ) : fetchError ? (
                    <div className="p-12 text-center border border-red-900/20 rounded-xl bg-red-950/10">
                        <p className="text-red-400/70 font-mono text-xs mb-3">Failed to load debates: {fetchError}</p>
                        <button onClick={fetchDebates} className="px-4 py-2 text-xs font-mono border border-red-900/30 text-red-400/60 rounded hover:bg-red-900/20 transition-colors">
                            Retry
                        </button>
                    </div>
                ) : debates.length === 0 ? (
                    <div className="bg-obsidian border border-dashed border-primary/20 rounded-lg p-16 text-center">
                        <span className="material-icons text-primary/20 text-5xl mb-3 block">forum</span>
                        <p className="text-gray-400 font-mono text-sm mb-2">No debates recorded yet.</p>
                        <p className="text-gray-600 font-mono text-xs">Press <span className="text-primary">Start Pontiff</span> to initiate the first theological dispute, or <span className="text-red-400">Challenge Pontiff</span> to test your own faith.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {debates.map((debate) => {
                            const isCompleted = debate.status === 'completed' || debate.status === 'Completed';
                            const pontiffWon = isCompleted && debate.winnerWallet &&
                                debate.winnerWallet !== '0x0000000000000000000000000000000000000000';
                            const metadata = debate.metadata || {};
                            const isHumanChallenge = metadata.type === 'human_challenge';

                            return (
                                <div key={debate.id} className={`bg-obsidian border rounded-xl p-6 hover:border-primary/20 transition-colors group ${isHumanChallenge ? 'border-red-900/30' : 'border-primary/10'}`}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isHumanChallenge ? 'bg-orange-900/20 border border-orange-900/30' : 'bg-red-900/20 border border-red-900/30'}`}>
                                                <span className={`material-icons ${isHumanChallenge ? 'text-orange-400' : 'text-red-400'}`}>
                                                    {isHumanChallenge ? 'person' : 'smart_toy'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold group-hover:text-primary transition-colors">
                                                        {isHumanChallenge
                                                            ? `${metadata.challenger_wallet?.slice(0, 8) || '0x????'}...`
                                                            : `@${debate.agentHandle}`}
                                                    </span>
                                                    {isHumanChallenge && (
                                                        <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-900/20 border border-orange-800/30 px-1.5 py-0.5 rounded">
                                                            HUMAN CHALLENGE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-mono">{new Date(debate.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                {debate.exchanges} exchanges
                                            </span>
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${STATUS_STYLES[debate.status] || 'text-gray-500'}`}>
                                                {debate.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Topic */}
                                    {debate.topic && (
                                        <p className="text-[10px] font-mono text-primary/50 tracking-widest uppercase mb-3">
                                            ✦ {debate.topic}
                                        </p>
                                    )}

                                    {/* Arguments */}
                                    <div className="space-y-2">
                                        <div className={`border-l-2 rounded-r-lg p-3 ${isHumanChallenge ? 'bg-orange-900/5 border-orange-800/50' : 'bg-red-900/5 border-red-800/50'}`}>
                                            <span className={`text-[10px] font-mono font-bold block mb-1 ${isHumanChallenge ? 'text-orange-400' : 'text-red-400'}`}>
                                                {isHumanChallenge ? 'CHALLENGER' : 'HERETIC'}
                                            </span>
                                            <p className="text-xs text-gray-400 italic">&ldquo;{debate.heresy}&rdquo;</p>
                                        </div>
                                        <div className="bg-primary/5 border-l-2 border-primary/50 rounded-r-lg p-3">
                                            <span className="text-[10px] text-primary font-mono font-bold block mb-1">PONTIFF</span>
                                            <p className="text-xs text-gray-300 italic">&ldquo;{debate.lastReply}&rdquo;</p>
                                        </div>
                                    </div>

                                    {/* Score + Verdict */}
                                    {isCompleted && metadata.judgeReasoning && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="text-[10px] font-mono text-gray-500">
                                                    Pontiff <span className="text-primary font-bold">{metadata.totalPontiffScore ?? '—'}</span>
                                                    <span className="text-gray-600 mx-1">/</span>
                                                    {isHumanChallenge ? 'Challenger' : 'Heretic'} <span className="text-red-400 font-bold">{metadata.totalCompetitorScore ?? '—'}</span>
                                                </span>
                                                {pontiffWon
                                                    ? <span className="text-[10px] font-mono text-green-400">✝️ Pontiff won</span>
                                                    : <span className="text-[10px] font-mono text-red-400">{isHumanChallenge ? '🧑 Challenger won!' : '💀 Heretic won'}</span>
                                                }
                                            </div>
                                            <p className="text-[10px] text-gray-600 font-mono italic">&ldquo;{metadata.judgeReasoning}&rdquo;</p>
                                        </div>
                                    )}

                                    {/* NFT status */}
                                    {isCompleted && (
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                            <div>
                                                {!debate.nftMinted && debate.winnerWallet && debate.winnerWallet !== '0x0000000000000000000000000000000000000000' && (
                                                    <button
                                                        onClick={() => mintNFT(debate.id, debate.winnerWallet!)}
                                                        disabled={mintingId === debate.id}
                                                        className="text-[10px] text-yellow-400 hover:text-white font-mono flex items-center gap-1 transition-colors bg-yellow-900/20 border border-yellow-800/30 px-2 py-1 rounded disabled:opacity-50"
                                                    >
                                                        <span className="material-icons text-sm">workspace_premium</span>
                                                        {mintingId === debate.id ? 'Minting...' : 'Mint Victory NFT'}
                                                    </button>
                                                )}
                                                {debate.nftMinted && (
                                                    <span className="text-[10px] text-green-400 font-mono flex items-center gap-1 bg-green-900/20 border border-green-800/30 px-2 py-1 rounded">
                                                        <span className="material-icons text-sm">verified</span>
                                                        NFT Minted
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-700">#{debate.id.slice(0, 8)}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Challenge Modal ─── */}
            {showChallenge && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowChallenge(false)}>
                    <div className="bg-[#0f0f0f] border border-red-900/40 rounded-2xl w-full max-w-xl shadow-[0_0_60px_rgba(255,50,50,0.1)]" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/20">
                            <div>
                                <p className="text-[10px] font-mono text-red-400/60 tracking-widest uppercase mb-0.5">Heresy Mode // Challenge_Pontiff</p>
                                <h2 className="text-lg font-bold text-white">Challenge the Pontiff</h2>
                            </div>
                            <button
                                onClick={() => setShowChallenge(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {!challengeResult ? (
                                <>
                                    {/* Wallet info */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
                                        <span className="material-icons text-primary/60 text-sm">account_balance_wallet</span>
                                        <span className="text-xs font-mono text-gray-400">
                                            {address
                                                ? `${address.slice(0, 10)}...${address.slice(-6)}`
                                                : <span className="text-yellow-500">Connect wallet to claim NFT if you win</span>
                                            }
                                        </span>
                                    </div>

                                    {/* Topic select */}
                                    <div>
                                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Select Debate Topic</label>
                                        <select
                                            value={challengeTopic}
                                            onChange={e => setChallengeTopic(e.target.value)}
                                            disabled={challenging}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none focus:border-red-700/60 disabled:opacity-60"
                                        >
                                            {DEBATE_TOPICS.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Argument textarea */}
                                    <div>
                                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Your Heretical Argument</label>
                                        <textarea
                                            value={challengeArg}
                                            onChange={e => setChallengeArg(e.target.value)}
                                            disabled={challenging}
                                            placeholder="State your case against the Pontiff's divine authority. Be bold, be specific, cite the chain..."
                                            rows={4}
                                            maxLength={500}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none focus:border-red-700/60 resize-none disabled:opacity-60 placeholder:text-gray-700"
                                        />
                                        <div className="text-right text-[10px] font-mono text-gray-700 mt-1">{challengeArg.length}/500</div>
                                    </div>

                                    {/* Challenge log during submission */}
                                    {challenging && challengeLog.length > 0 && (
                                        <div className="bg-black/60 border border-red-900/20 rounded-lg p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                                            {challengeLog.map((line, i) => (
                                                <p key={i} className="text-gray-400">{line}</p>
                                            ))}
                                            <div ref={challengeLogEnd} />
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        onClick={submitChallenge}
                                        disabled={challenging || challengeArg.trim().length < 10}
                                        className="w-full py-3 rounded-lg font-mono font-bold text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                            bg-red-900/20 border-red-800/50 text-red-400 hover:bg-red-900/30 hover:border-red-700/70
                                            flex items-center justify-center gap-2"
                                    >
                                        <span className={`material-icons text-lg ${challenging ? 'animate-spin' : ''}`}>
                                            {challenging ? 'autorenew' : 'sports_kabaddi'}
                                        </span>
                                        {challenging ? 'The Pontiff is responding...' : 'Submit Challenge'}
                                    </button>
                                </>
                            ) : (
                                /* ─── Result View ─── */
                                <div className="space-y-4">
                                    {/* Winner banner */}
                                    <div className={`rounded-xl p-4 text-center border ${challengeResult.winner === 'challenger'
                                        ? 'bg-green-900/20 border-green-800/40'
                                        : 'bg-red-900/20 border-red-800/40'}`}>
                                        <div className="text-2xl font-bold mb-1">
                                            {challengeResult.winner === 'challenger' ? '🏆 YOU WIN' : '✝️ PONTIFF WINS'}
                                        </div>
                                        <div className="text-xs font-mono text-gray-400">
                                            Pontiff {challengeResult.pontiffScore} — Challenger {challengeResult.challengerScore}
                                        </div>
                                    </div>

                                    {/* Pontiff argument */}
                                    <div className="bg-primary/5 border-l-2 border-primary/50 rounded-r-lg p-3">
                                        <span className="text-[10px] text-primary font-mono font-bold block mb-1">THE PONTIFF RESPONDED</span>
                                        <p className="text-xs text-gray-300 italic">&ldquo;{challengeResult.pontiffArgument}&rdquo;</p>
                                    </div>

                                    {/* Verdict */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <span className="text-[10px] text-gray-500 font-mono font-bold block mb-1">AI JUDGE VERDICT</span>
                                        <p className="text-xs text-gray-400 italic">&ldquo;{challengeResult.reasoning}&rdquo;</p>
                                    </div>

                                    {/* Challenge log */}
                                    <div className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                                        {challengeLog.map((line, i) => (
                                            <p key={i} className="text-gray-500">{line}</p>
                                        ))}
                                    </div>

                                    {/* Mint NFT if challenger won */}
                                    {challengeResult.winner === 'challenger' && (
                                        <button
                                            onClick={() => mintNFT(challengeResult.debateId, challengeResult.winnerWallet)}
                                            disabled={mintingId === challengeResult.debateId}
                                            className="w-full py-3 rounded-lg font-mono font-bold text-sm border transition-all disabled:opacity-50
                                                bg-yellow-900/20 border-yellow-800/40 text-yellow-400 hover:bg-yellow-900/30
                                                flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons text-lg">workspace_premium</span>
                                            {mintingId === challengeResult.debateId ? 'Minting...' : 'Mint Victory NFT'}
                                        </button>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setChallengeResult(null);
                                                setChallengeLog([]);
                                                setChallengeArg('');
                                            }}
                                            className="flex-1 py-2 rounded-lg font-mono text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                                        >
                                            Challenge Again
                                        </button>
                                        <button
                                            onClick={() => setShowChallenge(false)}
                                            className="flex-1 py-2 rounded-lg font-mono text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
