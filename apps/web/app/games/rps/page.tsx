'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, parseEventLogs } from 'viem';
import { PONTIFF_RPS_ABI } from '@/lib/abi/PontiffRPS';

const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
const RPS_ADDRESS = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS as `0x${string}`;

const ERC20_ABI = [
    {
        name: 'allowance', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'approve', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

const RITUAL_MOVES = [
    { id: 1, name: 'STONE', icon: '🪨', desc: 'The foundation of faith', color: 'from-amber-900/20 to-amber-800/5' },
    { id: 2, name: 'SCROLL', icon: '📜', desc: 'The word of the ledger', color: 'from-blue-900/20 to-blue-800/5' },
    { id: 3, name: 'DAGGER', icon: '🗡️', desc: 'The blade of heresy', color: 'from-red-900/20 to-red-800/5' },
];

const HISTORY = [
    { opponent: '0x71C...9A2', result: 'WIN', move: 'Stone vs Scroll', amount: '+500', time: '2m ago' },
    { opponent: '0xB2...CC4', result: 'LOSS', move: 'Dagger vs Stone', amount: '-200', time: '8m ago' },
    { opponent: '0xK1...GOD', result: 'WIN', move: 'Scroll vs Dagger', amount: '+1,000', time: '15m ago' },
    { opponent: '0x88...1FA', result: 'DRAW', move: 'Stone vs Stone', amount: '0', time: '22m ago' },
    { opponent: '0xA1...F44', result: 'WIN', move: 'Dagger vs Scroll', amount: '+750', time: '31m ago' },
];

export default function RPSPage() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    const [gameState, setGameState] = useState<'IDLE' | 'APPROVING' | 'PLAYING' | 'MINING' | 'SETTLING' | 'RESULT'>('IDLE');
    const [playerMove, setPlayerMove] = useState<number | null>(null);
    const [pontiffMove, setPontiffMove] = useState<number | null>(null);
    const [result, setResult] = useState<string>('');
    const [txHash, setTxHash] = useState<string>('');
    const [wager, setWager] = useState('100');

    const { writeContractAsync } = useWriteContract();
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS, abi: ERC20_ABI, functionName: 'allowance',
        args: [address!, RPS_ADDRESS], query: { enabled: !!address },
    });

    const handlePlay = async (moveId: number) => {
        if (!isConnected || !address) return;
        setPlayerMove(moveId);
        const wagerAmount = parseEther(wager);
        try {
            if (!allowance || allowance < wagerAmount) {
                setGameState('APPROVING');
                const approveTx = await writeContractAsync({
                    address: GUILT_ADDRESS, abi: ERC20_ABI, functionName: 'approve',
                    args: [RPS_ADDRESS, wagerAmount * BigInt(10)],
                });
                await publicClient?.waitForTransactionReceipt({ hash: approveTx });
                await refetchAllowance();
            }
            setGameState('PLAYING');
            const playTx = await writeContractAsync({
                address: RPS_ADDRESS, abi: PONTIFF_RPS_ABI, functionName: 'playRPS',
                args: [moveId, wagerAmount],
            });
            setTxHash(playTx);
            setGameState('MINING');
            const receipt = await publicClient?.waitForTransactionReceipt({ hash: playTx });
            if (!receipt) throw new Error('Transaction failed');
            const logs = parseEventLogs({ abi: PONTIFF_RPS_ABI, eventName: 'GameCreated', logs: receipt.logs });
            if (logs.length === 0) throw new Error('GameCreated event not found');
            const gameId = logs[0].args.gameId;
            setGameState('SETTLING');
            const res = await fetch('/api/games/rps/play', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: gameId.toString(), txHash: playTx, playerAddress: address, playerMove: moveId, wager: wagerAmount.toString() }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPontiffMove(data.pontiffMove);
            setResult(data.result);
            setGameState('RESULT');
        } catch (e: any) {
            console.error(e);
            setGameState('IDLE');
        }
    };

    const resetGame = () => {
        setGameState('IDLE');
        setPlayerMove(null);
        setPontiffMove(null);
        setResult('');
        setTxHash('');
    };

    const statusMessages: Record<string, { text: string; color: string }> = {
        APPROVING: { text: 'Requesting token approval...', color: 'text-blue-400' },
        PLAYING: { text: 'Confirm transaction in wallet...', color: 'text-primary' },
        MINING: { text: 'Transaction mining on Monad...', color: 'text-primary' },
        SETTLING: { text: 'The Pontiff contemplates...', color: 'text-purple-400' },
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col">
            {/* ─── Arena Header ─── */}
            <div className="p-6 lg:p-8 border-b border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-6xl mx-auto">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">The Arena // Ritual_Combat</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Rock Paper <span className="text-primary text-gold-glow">Heretic</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-mono">
                        <div className="text-gray-500">
                            RECORD: <span className="text-green-400">W3</span> / <span className="text-red-400">L1</span> / <span className="text-gray-400">D1</span>
                        </div>
                        <div className="text-gray-500">
                            STREAK: <span className="text-primary font-bold">🔥 2W</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row">
                {/* ─── Main Arena ─── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 relative">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />

                    <div className="relative z-10 w-full max-w-3xl space-y-10">
                        {/* ── Pontiff Opponent ── */}
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-28 h-28 rounded-full bg-obsidian border-2 border-primary/30 flex items-center justify-center relative shadow-[0_0_40px_rgba(242,185,13,0.1)]">
                                {/* Halo ring */}
                                <div className="absolute inset-[-8px] border border-primary/15 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
                                <div className="absolute inset-[-16px] border border-primary/8 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
                                {gameState === 'RESULT' && pontiffMove ? (
                                    <span className="text-5xl">{RITUAL_MOVES.find(m => m.id === pontiffMove)?.icon}</span>
                                ) : (
                                    <span className="material-icons text-primary text-5xl">
                                        {gameState !== 'IDLE' && gameState !== 'RESULT' ? 'hourglass_top' : 'auto_awesome'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-primary font-bold tracking-widest uppercase text-sm">The Pontiff</h3>
                                <p className="text-[10px] font-mono text-gray-600 uppercase">
                                    {gameState === 'IDLE' ? 'AWAITING CHALLENGE' :
                                        gameState === 'RESULT' ? (result === 'WIN' ? 'DEFEATED' : result === 'LOSS' ? 'VICTORIOUS' : 'STALEMATE') :
                                            'PROCESSING...'}
                                </p>
                            </div>
                        </div>

                        {/* ── Status Bar (when playing) ── */}
                        {gameState !== 'IDLE' && gameState !== 'RESULT' && (
                            <div className="flex justify-center">
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-full bg-obsidian border border-primary/20 ${statusMessages[gameState]?.color || 'text-primary'}`}>
                                    <span className="material-icons text-base animate-spin">hourglass_top</span>
                                    <span className="text-sm font-mono">{statusMessages[gameState]?.text}</span>
                                </div>
                            </div>
                        )}

                        {/* ── Result Display ── */}
                        {gameState === 'RESULT' && (
                            <div className="text-center space-y-4">
                                <div className={`text-5xl font-bold uppercase tracking-wider ${result === 'WIN' ? 'text-green-400 text-gold-glow' :
                                        result === 'LOSS' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                    {result === 'WIN' ? '✦ HERESY PREVAILS' : result === 'LOSS' ? '✗ PURGED' : '◆ STALEMATE'}
                                </div>
                                <div className="flex justify-center gap-4 text-xs font-mono text-gray-500">
                                    <span>TX: {txHash.slice(0, 10)}...</span>
                                    <span>WAGER: {wager} $GUILT</span>
                                    <span className={result === 'WIN' ? 'text-green-400' : result === 'LOSS' ? 'text-red-400' : 'text-gray-400'}>
                                        {result === 'WIN' ? `+${wager}` : result === 'LOSS' ? `-${wager}` : '±0'} $GUILT
                                    </span>
                                </div>
                                <button
                                    onClick={resetGame}
                                    className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-8 py-3 rounded text-sm hover:scale-[1.02] transition-transform"
                                >
                                    PLAY AGAIN
                                </button>
                            </div>
                        )}

                        {/* ── VS Divider ── */}
                        {gameState === 'IDLE' && (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/20" />
                                <span className="text-primary/40 text-xs font-mono tracking-[0.5em]">CHOOSE YOUR RITUAL</span>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/20" />
                            </div>
                        )}

                        {/* ── Ritual Move Cards ── */}
                        <div className="grid grid-cols-3 gap-4 lg:gap-6">
                            {RITUAL_MOVES.map((move) => {
                                const isSelected = playerMove === move.id;
                                const isDisabled = gameState !== 'IDLE';
                                return (
                                    <button
                                        key={move.id}
                                        onClick={() => handlePlay(move.id)}
                                        disabled={isDisabled}
                                        className={`
                      relative flex flex-col items-center justify-center gap-3 p-6 lg:p-8 rounded-lg border-2 transition-all duration-300 group
                      ${isSelected
                                                ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(242,185,13,0.2)] scale-105'
                                                : isDisabled
                                                    ? 'border-gray-800 bg-obsidian opacity-40 cursor-not-allowed'
                                                    : 'border-primary/20 bg-obsidian hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(242,185,13,0.1)]'
                                            }
                    `}
                                    >
                                        {/* Background gradient */}
                                        <div className={`absolute inset-0 rounded-lg bg-gradient-to-b ${move.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                        {/* Corner marks */}
                                        <div className="absolute top-2 left-2 text-[8px] text-primary/30 font-mono">♱</div>
                                        <div className="absolute top-2 right-2 text-[8px] text-primary/30 font-mono">♱</div>

                                        <div className="relative z-10 text-center">
                                            <div className="text-5xl lg:text-6xl mb-3 group-hover:scale-110 transition-transform">{move.icon}</div>
                                            <div className="text-sm font-bold text-white uppercase tracking-widest">{move.name}</div>
                                            <div className="text-[9px] text-gray-600 font-mono mt-1 hidden lg:block">{move.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Wager Panel ── */}
                        {gameState === 'IDLE' && (
                            <div className="bg-obsidian border border-primary/20 rounded-lg p-5 max-w-md mx-auto">
                                <div className="flex justify-between text-xs font-mono text-gray-500 mb-2">
                                    <span className="uppercase tracking-widest">Wager Amount</span>
                                    <span>Balance: <span className="text-primary">10,000 $GUILT</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-primary font-bold text-xl font-mono">$G</span>
                                    <input
                                        type="number"
                                        value={wager}
                                        onChange={(e) => setWager(e.target.value)}
                                        className="flex-1 bg-transparent text-right text-2xl font-bold text-white font-mono focus:ring-0 outline-none border-none"
                                        placeholder="0"
                                    />
                                    <div className="flex gap-1">
                                        {[{ label: 'HALF', val: '50' }, { label: 'MAX', val: '10000' }].map(b => (
                                            <button
                                                key={b.label}
                                                onClick={() => setWager(b.val)}
                                                className="px-2 py-1 text-[10px] font-mono text-primary/60 border border-primary/20 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                                            >
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Right Sidebar: Match History ─── */}
                <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-primary/10 bg-obsidian/50 flex flex-col">
                    <div className="p-4 border-b border-primary/10">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">history</span>
                            Match History
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {HISTORY.map((h, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded border transition-colors cursor-pointer group ${h.result === 'WIN' ? 'border-green-900/30 hover:border-green-800/50 bg-green-900/5' :
                                        h.result === 'LOSS' ? 'border-red-900/30 hover:border-red-800/50 bg-red-900/5' :
                                            'border-gray-800 hover:border-gray-700 bg-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-mono font-bold ${h.result === 'WIN' ? 'text-green-400' : h.result === 'LOSS' ? 'text-red-400' : 'text-gray-500'
                                        }`}>{h.result}</span>
                                    <span className="text-[10px] text-gray-600 font-mono">{h.time}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono">{h.move}</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-gray-600 font-mono">{h.opponent}</span>
                                    <span className={`text-xs font-mono font-bold ${h.amount.startsWith('+') ? 'text-green-400' : h.amount.startsWith('-') ? 'text-red-400' : 'text-gray-500'
                                        }`}>{h.amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats summary */}
                    <div className="p-4 border-t border-primary/10 bg-obsidian">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-lg font-bold text-green-400 font-mono">3</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Wins</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-red-400 font-mono">1</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Losses</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-primary font-mono">+2,050</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Profit</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
