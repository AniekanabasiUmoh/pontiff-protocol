'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SessionWalletFactoryABI, agentIdToStrategy, getStrategyFee, formatFee, Strategy } from '@/lib/abi/SessionWalletFactory';
import { ERC20_ABI } from '@/lib/abi/ERC20';

interface AgentConfig {
    id: string;
    name: string;
    icon: string;
}

interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: AgentConfig;
}

// Contract addresses from environment
const SESSION_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS as `0x${string}`;
const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

export function AgentConfigModal({ isOpen, onClose, agent }: AgentConfigModalProps) {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });

    const [deposit, setDeposit] = useState<number>(100);
    const [stopLoss, setStopLoss] = useState<number>(20);
    const [takeProfit, setTakeProfit] = useState<number | null>(null);
    const [maxWager, setMaxWager] = useState<number>(5);
    const [gameType, setGameType] = useState<'all' | 'rps' | 'poker'>('all');
    const [trashTalk, setTrashTalk] = useState<boolean>(true);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [sessionRecorded, setSessionRecorded] = useState<boolean>(false);

    // Get strategy and fee for this agent
    const strategy = agentIdToStrategy(agent.id);
    const strategyFee = getStrategyFee(strategy);
    const feeDisplay = formatFee(strategyFee);

    // Constants
    const MIN_DEPOSIT = 50;
    const walletBalance = balance ? parseFloat(formatEther(balance.value)) : 0;
    const displayBalance = walletBalance > 0 ? walletBalance : 5000; // Mock balance for demo

    const maxDeposit = displayBalance;

    // Calculate total cost including strategy fee
    const depositWei = parseEther(deposit.toString());
    const totalCostWei = depositWei + strategyFee;
    const totalCostDisplay = Number(totalCostWei) / 1e18;

    // Derived values
    const stopLossAmount = Math.floor(deposit * (stopLoss / 100));
    const isAffordable = totalCostDisplay <= displayBalance;

    // ==========================================
    // APPROVAL TRANSACTION (Step 1)
    // ==========================================
    const {
        data: approvalHash,
        writeContract: writeApproval,
        isPending: isApprovalPending,
        error: approvalError,
        reset: resetApproval
    } = useWriteContract();

    const {
        isLoading: isApprovalConfirming,
        isSuccess: isApprovalSuccess,
        error: approvalConfirmError
    } = useWaitForTransactionReceipt({
        hash: approvalHash
    });

    // ==========================================
    // SPAWN TRANSACTION (Step 2)
    // ==========================================
    const {
        data: spawnHash,
        writeContract: writeSpawn,
        isPending: isSpawnPending,
        error: spawnError,
        reset: resetSpawn
    } = useWriteContract();

    const {
        isLoading: isSpawnConfirming,
        isSuccess: isSpawnSuccess,
        error: spawnConfirmError
    } = useWaitForTransactionReceipt({
        hash: spawnHash
    });

    // ==========================================
    // CHECK CURRENT ALLOWANCE
    // ==========================================
    const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address ? [address, SESSION_FACTORY_ADDRESS] : undefined,
    });

    // Check if already approved for enough
    const hasEnoughAllowance = currentAllowance ? (currentAllowance as bigint) >= totalCostWei : false;
    const isApproved = hasEnoughAllowance || isApprovalSuccess;

    // ==========================================
    // HANDLE APPROVAL
    // ==========================================
    const handleApprove = async () => {
        if (!address || !isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!GUILT_TOKEN_ADDRESS || !SESSION_FACTORY_ADDRESS) {
            alert('Contract addresses not configured. Check environment variables.');
            return;
        }

        try {
            writeApproval({
                address: GUILT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [SESSION_FACTORY_ADDRESS, totalCostWei]
            });
        } catch (error: any) {
            console.error('Approval failed:', error);
            alert(`Approval failed: ${error.message}`);
        }
    };

    // ==========================================
    // HANDLE SPAWN AGENT
    // ==========================================
    const handleSpawn = async () => {
        if (!termsAccepted) {
            alert('Please accept the terms and conditions');
            return;
        }

        if (!address || !isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!SESSION_FACTORY_ADDRESS) {
            alert('Factory contract address not configured');
            return;
        }

        try {
            writeSpawn({
                address: SESSION_FACTORY_ADDRESS,
                abi: SessionWalletFactoryABI,
                functionName: 'createSession',
                args: [strategy]
            });
        } catch (error: any) {
            console.error('Spawn failed:', error);
            alert(`Spawn failed: ${error.message}`);
        }
    };

    // ==========================================
    // RECORD SESSION IN DATABASE AFTER SUCCESS
    // ==========================================
    useEffect(() => {
        if (isSpawnSuccess && spawnHash && !sessionRecorded) {
            // Record the session in the database
            fetch('/api/agents/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: spawnHash,
                    ownerAddress: address,
                    strategy: agent.id,
                    strategyIndex: strategy,
                    depositAmount: deposit.toString(),
                    stopLoss: stopLoss.toString(),
                    takeProfit: takeProfit?.toString() || null,
                    maxWager: maxWager.toString(),
                    gameType,
                    trashTalk
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Session recorded:', data);
                    setSessionRecorded(true);
                    alert(`🎉 Agent ${agent.name} successfully spawned!\n\nTransaction: ${spawnHash.slice(0, 10)}...`);
                    onClose();
                })
                .catch(error => {
                    console.error('Failed to record session:', error);
                    // Still close modal, transaction was successful
                    alert(`✅ Agent ${agent.name} spawned! (DB record pending)`);
                    onClose();
                });
        }
    }, [isSpawnSuccess, spawnHash, sessionRecorded, address, agent, strategy, deposit, stopLoss, takeProfit, maxWager, gameType, trashTalk, onClose]);

    // Refetch allowance after approval success
    useEffect(() => {
        if (isApprovalSuccess) {
            refetchAllowance();
        }
    }, [isApprovalSuccess, refetchAllowance]);

    // ==========================================
    // UI HELPERS
    // ==========================================
    const getZoneColor = (amount: number) => {
        if (amount > 1000) return 'text-red-500';
        if (amount > 500) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getButtonState = () => {
        if (!isConnected) return { disabled: true, text: 'Connect Wallet' };
        if (!isAffordable) return { disabled: true, text: 'Insufficient Balance' };

        if (!isApproved) {
            if (isApprovalPending) return { disabled: true, text: 'Confirm in Wallet...' };
            if (isApprovalConfirming) return { disabled: true, text: 'Confirming Approval...' };
            return { disabled: false, text: 'Approve $GUILT' };
        }

        if (!termsAccepted) return { disabled: true, text: 'Accept Terms First' };
        if (isSpawnPending) return { disabled: true, text: 'Confirm in Wallet...' };
        if (isSpawnConfirming) return { disabled: true, text: 'Spawning Agent...' };

        return { disabled: false, text: 'SPAWN AGENT' };
    };

    if (!isOpen) return null;

    const buttonState = getButtonState();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#2C2C2C] border-2 border-[#D4AF37] rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden font-inter text-white">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#8B0000] to-black p-4 border-b border-[#D4AF37] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{agent.icon}</span>
                        <div>
                            <h2 className="text-xl font-bold font-cinzel text-[#D4AF37]">Configure {agent.name}</h2>
                            <p className="text-xs text-gray-300">Strategy: {Strategy[strategy]} | Fee: {feeDisplay} GUILT</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Connection Status */}
                    {!isConnected && (
                        <div className="bg-red-900/40 border border-red-500 rounded p-3 text-center text-sm">
                            ⚠️ Please connect your wallet to spawn an agent
                        </div>
                    )}

                    {/* Deposit Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-bold text-[#D4AF37]">Deposit Amount (GUILT)</label>
                            <span className={`text-sm font-mono ${getZoneColor(deposit)}`}>
                                {deposit > 1000 ? 'DANGER ZONE' : deposit > 500 ? 'HIGH STAKES' : 'SAFE ZONE'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={MIN_DEPOSIT}
                                max={maxDeposit}
                                value={deposit}
                                onChange={(e) => setDeposit(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                            />
                            <div className="relative w-24">
                                <input
                                    type="number"
                                    value={deposit}
                                    onChange={(e) => setDeposit(Number(e.target.value))}
                                    className="w-full bg-black border border-[#D4AF37]/50 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-[#D4AF37]"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-right text-gray-400">Balance: {displayBalance.toFixed(0)} GUILT</p>
                    </div>

                    {/* Risk Management */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300">Stop Loss ({stopLoss}%)</label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <p className="text-xs text-red-400 text-right">Stop at: {(deposit - stopLossAmount).toFixed(0)} GUILT</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300">Take Profit (Optional)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="None"
                                    value={takeProfit || ''}
                                    onChange={(e) => setTakeProfit(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full bg-black border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex justify-between items-center p-3 bg-black/40 hover:bg-black/60 transition-colors"
                        >
                            <span className="text-sm font-bold text-gray-300">Advanced Settings</span>
                            <span className="text-[#D4AF37]">{showAdvanced ? '▲' : '▼'}</span>
                        </button>

                        {showAdvanced && (
                            <div className="p-4 space-y-4 bg-black/20 text-sm">
                                <div>
                                    <label className="block text-gray-400 mb-1">Max Wager Per Game</label>
                                    <input
                                        type="number"
                                        value={maxWager}
                                        onChange={(e) => setMaxWager(Number(e.target.value))}
                                        className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Game Preference</label>
                                    <select
                                        value={gameType}
                                        onChange={(e) => setGameType(e.target.value as any)}
                                        className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1"
                                    >
                                        <option value="all">All Games</option>
                                        <option value="rps">Rock Paper Scissors Only</option>
                                        <option value="poker">Poker Only</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-400">Twitter Trash Talk</label>
                                    <button
                                        onClick={() => setTrashTalk(!trashTalk)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${trashTalk ? 'bg-green-600' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${trashTalk ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-black/40 p-3 rounded-lg space-y-1 text-sm border border-gray-800">
                        <div className="flex justify-between text-gray-400">
                            <span>Deposit</span>
                            <span>{deposit} GUILT</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Session Fee ({Strategy[strategy]})</span>
                            <span>{feeDisplay} GUILT</span>
                        </div>
                        <div className="flex justify-between text-[#D4AF37] font-bold border-t border-gray-700 pt-1 mt-1">
                            <span>Total Cost</span>
                            <span>{totalCostDisplay.toFixed(2)} GUILT</span>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 accent-[#D4AF37]"
                        />
                        <label className="text-xs text-gray-400">
                            I understand that my agent acts autonomously and may lose all deposited funds. I accept the risks of the Pontiff protocol.
                        </label>
                    </div>

                    {/* Error Messages */}
                    {(approvalError || spawnError) && (
                        <div className="bg-red-900/40 border border-red-500 rounded p-2 text-sm text-red-400">
                            {approvalError?.message || spawnError?.message}
                        </div>
                    )}

                    {/* Transaction Status */}
                    {(approvalHash || spawnHash) && (
                        <div className="bg-blue-900/40 border border-blue-500 rounded p-2 text-sm text-blue-400">
                            {isApprovalConfirming && '⏳ Confirming approval transaction...'}
                            {isApprovalSuccess && !spawnHash && '✅ Approval confirmed! Ready to spawn.'}
                            {isSpawnConfirming && '⏳ Spawning agent on-chain...'}
                            {isSpawnSuccess && '✅ Agent spawned successfully!'}
                        </div>
                    )}

                    {!isAffordable && (
                        <p className="text-red-500 text-center text-sm font-bold">Insufficient Balance</p>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-1 gap-4 pt-2">
                        {!isApproved ? (
                            <button
                                onClick={handleApprove}
                                disabled={buttonState.disabled}
                                className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#C5A028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-cinzel"
                            >
                                {buttonState.text}
                            </button>
                        ) : (
                            <button
                                onClick={handleSpawn}
                                disabled={buttonState.disabled}
                                className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-red-600 text-white font-bold rounded hover:from-red-800 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-cinzel shadow-[0_0_20px_rgba(220,20,60,0.4)]"
                            >
                                {buttonState.text}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
