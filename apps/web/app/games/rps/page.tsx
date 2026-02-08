'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, defineChain, parseEventLogs } from 'viem';
import { PONTIFF_RPS_ABI } from '@/lib/abi/PontiffRPS';

// Contract Addresses (from env)
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
const RPS_ADDRESS = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS as `0x${string}`;

// Partial ERC20 ABI for allowance/approve
const ERC20_ABI = [
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

export default function RPSPage() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // Game State
    const [gameState, setGameState] = useState<'IDLE' | 'APPROVING' | 'PLAYING' | 'MINING' | 'SETTLING' | 'RESULT'>('IDLE');
    const [playerMove, setPlayerMove] = useState<number | null>(null);
    const [pontiffMove, setPontiffMove] = useState<number | null>(null);
    const [result, setResult] = useState<string>("");
    const [txHash, setTxHash] = useState<string>("");
    const [wager, setWager] = useState("100"); // 100 GUILT Default

    const moves = [
        { id: 1, name: 'ROCK', icon: '🪨' },
        { id: 2, name: 'PAPER', icon: '📄' },
        { id: 3, name: 'SCISSORS', icon: '✂️' }
    ];

    // Wagmi Hooks
    const { writeContractAsync } = useWriteContract();

    // Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, RPS_ADDRESS],
        query: { enabled: !!address },
    });

    const handlePlay = async (moveId: number) => {
        if (!isConnected || !address) {
            alert("Please connect your wallet first.");
            return;
        }

        setPlayerMove(moveId);
        const wagerAmount = parseEther(wager);

        try {
            // 1. Check/Request Approval
            if (!allowance || allowance < wagerAmount) {
                setGameState('APPROVING');
                const approveTx = await writeContractAsync({
                    address: GUILT_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [RPS_ADDRESS, wagerAmount * BigInt(10)], // Approve 10x for convenience
                });
                console.log("Approving...", approveTx);
                await publicClient?.waitForTransactionReceipt({ hash: approveTx });
                await refetchAllowance();
            }

            // 2. Play Game (On-Chain)
            setGameState('PLAYING'); // Sending Tx
            const playTx = await writeContractAsync({
                address: RPS_ADDRESS,
                abi: PONTIFF_RPS_ABI,
                functionName: 'playRPS',
                args: [moveId, wagerAmount],
            });
            setTxHash(playTx);
            setGameState('MINING'); // Waiting for Block

            const receipt = await publicClient?.waitForTransactionReceipt({ hash: playTx });

            // 3. Parse Event to get GameID
            if (!receipt) throw new Error("Transaction failed");

            // We need to parse logs to find GameCreated
            // Since we imported the ABI, we can parse logs manually or use viem helpers if available on client
            // Simple manual parse or search
            // The event signature is GameCreated(uint256,address,uint256,uint8)
            // But we can just use the API to look up by TxHash if parsing is hard here
            // Let's try parsing with publicClient.

            const logs = parseEventLogs({
                abi: PONTIFF_RPS_ABI,
                eventName: 'GameCreated',
                logs: receipt.logs
            });

            if (logs.length === 0) throw new Error("GameCreated event not found");
            const gameId = logs[0].args.gameId;
            console.log("Game ID:", gameId);

            // 4. Call Backend to Settle
            setGameState('SETTLING');
            const res = await fetch('/api/games/rps/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: gameId.toString(),
                    txHash: playTx,
                    playerAddress: address,
                    playerMove: moveId,
                    wager: wagerAmount.toString()
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setPontiffMove(data.pontiffMove);
            setResult(data.result);
            setGameState('RESULT');

        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || "Transaction failed"}`);
            setGameState('IDLE');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
            <h1 className="text-5xl font-bold mb-8 text-yellow-500">ROCK PAPER HERETIC</h1>

            {/* Wager Input */}
            <div className="mb-8 flex items-center gap-4">
                <span className="text-xl">Wager (GUILT):</span>
                <input
                    type="number"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    className="bg-gray-800 border border-gray-600 p-2 rounded text-white w-32 text-center"
                    disabled={gameState !== 'IDLE'}
                />
            </div>

            <div className="flex gap-8 mb-12">
                {moves.map(m => (
                    <button
                        key={m.id}
                        onClick={() => handlePlay(m.id)}
                        disabled={gameState !== 'IDLE'}
                        className={`p-8 border-4 border-gray-700 rounded-xl hover:border-yellow-500 transition-all 
                            ${playerMove === m.id ? 'bg-yellow-900 border-yellow-500' : 'bg-gray-900'}
                            ${gameState !== 'IDLE' && playerMove !== m.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="text-8xl mb-4">{m.icon}</div>
                        <div className="font-bold text-center">{m.name}</div>
                    </button>
                ))}
            </div>

            {/* Status Messages */}
            {gameState === 'APPROVING' && <div className="text-2xl animate-pulse text-blue-400">Approving Token Spend...</div>}
            {gameState === 'PLAYING' && <div className="text-2xl animate-pulse text-yellow-400">Confirming on Wallet...</div>}
            {gameState === 'MINING' && <div className="text-2xl animate-pulse text-yellow-400">Mining Transaction...</div>}
            {gameState === 'SETTLING' && <div className="text-2xl animate-pulse text-purple-400">The Pontiff is Deciding...</div>}

            {gameState === 'RESULT' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center p-8 bg-gray-900 border-2 border-white rounded-lg mt-8"
                >
                    <div className="text-2xl text-gray-400 mb-4">PONTIFF CHOSE:</div>
                    <div className="text-8xl mb-6">
                        {moves.find(m => m.id === pontiffMove)?.icon}
                    </div>

                    <div className={`text-6xl font-bold mb-4 ${result === 'WIN' ? 'text-green-500' : result === 'LOSS' ? 'text-red-500' : 'text-gray-500'}`}>
                        {result === 'WIN' ? 'HERESY PREVAILS!' : result === 'LOSS' ? 'PURGED' : 'STALEMATE'}
                    </div>

                    <div className="text-sm text-gray-500 mb-6">Tx: {txHash.slice(0, 10)}...</div>

                    <button
                        onClick={() => { setGameState('IDLE'); setPlayerMove(null); setPontiffMove(null); }}
                        className="mt-4 bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200"
                    >
                        PLAY AGAIN
                    </button>
                </motion.div>
            )}

            <div className="mt-12 text-gray-600 text-xs text-center max-w-md">
                ⚠️ <span className="font-bold">TRUSTED SETUP:</span> The Pontiff (Backend) can technically see your move before settling.
                Full cryptographic fairness (Commit-Reveal) is coming in Phase 2.
            </div>
        </div>
    );
}
