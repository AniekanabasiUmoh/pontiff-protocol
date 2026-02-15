'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSignMessage } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SessionWalletFactoryABI, agentIdToStrategy, getStrategyFee, formatFee, Strategy } from '@/lib/abi/SessionWalletFactory';
import { ERC20_ABI } from '@/lib/abi/ERC20';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/ui/Toast';

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
    const router = useRouter();
    const { showToast } = useToast();
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({
        address,
        token: GUILT_TOKEN_ADDRESS // Check GUILT token balance, not native
    });

    const [deposit, setDeposit] = useState<number>(100);
    const [stopLoss, setStopLoss] = useState<number>(20);
    const [takeProfit, setTakeProfit] = useState<number | null>(null);
    const [maxWager, setMaxWager] = useState<number>(5);
    const [gameType, setGameType] = useState<'all' | 'rps' | 'poker'>('all'); // Poker re-enabled
    const [trashTalk, setTrashTalk] = useState<boolean>(true);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [sessionRecorded, setSessionRecorded] = useState<boolean>(false);

    // PvP Mode
    const [agentMode, setAgentMode] = useState<'PvE' | 'PvP_Any' | 'PvP_Target'>('PvE');
    const [targetArchetype, setTargetArchetype] = useState<string>('');
    const isPvP = agentMode !== 'PvE';

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

    // Derived values - BUG FIX #6: Calculate absolute stop-loss amount
    const stopLossAmount = Math.floor(deposit * (stopLoss / 100));
    const takeProfitAmount = takeProfit ? Math.floor(deposit * (takeProfit / 100)) : null;
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
            showToast('Wallet not connected', 'error', 'Please connect your wallet first');
            return;
        }

        if (!GUILT_TOKEN_ADDRESS || !SESSION_FACTORY_ADDRESS) {
            showToast('Config error', 'error', 'Contract addresses not configured');
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
            showToast('Approval failed', 'error', error.message);
        }
    };

    // ==========================================
    // HANDLE SPAWN AGENT
    // ==========================================
    const handleSpawn = async () => {
        if (!termsAccepted) {
            showToast('Terms required', 'warning', 'Please accept the terms and conditions');
            return;
        }

        if (!address || !isConnected) {
            showToast('Wallet not connected', 'error', 'Please connect your wallet first');
            return;
        }

        if (!SESSION_FACTORY_ADDRESS) {
            showToast('Config error', 'error', 'Factory contract address not configured');
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
            showToast('Spawn failed', 'error', error.message);
        }
    };

    // ==========================================
    // RECORD SESSION IN DATABASE AFTER SUCCESS
    // ==========================================
    // DEBUG: Monitor spawn state
    useEffect(() => {
        console.log('Spawn State:', {
            isSpawnSuccess,
            spawnHash,
            sessionRecorded,
            address
        });
    }, [isSpawnSuccess, spawnHash, sessionRecorded, address]);

    // ==========================================
    // FUNDING TRANSACTION (Step 3)
    // ==========================================
    const {
        data: fundingHash,
        writeContract: writeFunding,
        isPending: isFundingPending,
        error: fundingError
    } = useWriteContract();

    const {
        isLoading: isFundingConfirming,
        isSuccess: isFundingSuccess
    } = useWaitForTransactionReceipt({
        hash: fundingHash
    });

    const [newSessionWallet, setNewSessionWallet] = useState<string | null>(null);

    // ==========================================
    // HANDLE SPAWN SUCCESS -> TRIGGER FUNDING
    // ==========================================
    const { data: spawnReceipt, isSuccess: isSpawnConfirmed } = useWaitForTransactionReceipt({
        hash: spawnHash
    });

    useEffect(() => {
        if (isSpawnConfirmed && spawnReceipt && !newSessionWallet) {
            console.log('✅ Spawn confirmed! Finding session wallet...');

            // Parse event to find new wallet address
            // Event: SessionCreated(address user, address sessionWallet, ...)
            // Topic0: 0x... (SessionCreated hash)
            // sessionWallet is 2nd indexed arg (topics[2])

            try {
                // Find log with correct topics length for SessionCreated
                // We'll just look for the one that has our address in topic[1] (user)
                const userTopic = '0x000000000000000000000000' + address?.slice(2).toLowerCase();

                const log = spawnReceipt.logs.find(l =>
                    l.address.toLowerCase() === SESSION_FACTORY_ADDRESS?.toLowerCase() &&
                    l.topics[1]?.toLowerCase() === userTopic &&
                    l.topics[2] !== undefined
                );

                if (log && log.topics[2]) {
                    const walletAddress = ('0x' + log.topics[2].slice(26)) as `0x${string}`; // Remove padding
                    console.log('🏠 Found Session Wallet:', walletAddress);
                    setNewSessionWallet(walletAddress);

                    // 🚀 Trigger Funding - IMMEDIATE PROMPT
                    writeFunding({
                        address: GUILT_TOKEN_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'transfer',
                        args: [walletAddress, depositWei]
                    });
                } else {
                    console.error('Could not find SessionCreated event in logs');
                    showToast('Parse error', 'error', 'Session wallet address not found in transaction logs');
                }
            } catch (e) {
                console.error('Error parsing spawn logs:', e);
            }
        }
    }, [isSpawnConfirmed, spawnReceipt, address, newSessionWallet, depositWei, writeFunding]);

    // ==========================================
    // HANDLE FUNDING SUCCESS -> RECORD SESSION
    // ==========================================
    // ==========================================
    // HANDLE FUNDING SUCCESS -> RECORD SESSION
    // ==========================================
    const { signMessageAsync } = useSignMessage(); // Use hook

    useEffect(() => {
        if (isFundingSuccess && fundingHash && !sessionRecorded && newSessionWallet && address) {
            console.log('🚀 Funding successful! Recording session...');
            showToast('Funding confirmed', 'success', `${deposit} GUILT sent to session wallet`);

            const registerAndStart = async () => {
                try {
                    // Sign Registration (Deploy)
                    const regTimestamp = Date.now();
                    const regMessage = `Pontiff Action: deploy_agent at ${regTimestamp}`;
                    const regSignature = await signMessageAsync({ message: regMessage });

                    const response = await fetch('/api/agents/sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            txHash: spawnHash,
                            fundingTxHash: fundingHash,
                            ownerAddress: address,
                            strategy: agent.id,
                            strategyIndex: strategy,
                            depositAmount: deposit.toString(),
                            stopLoss: stopLossAmount.toString(),
                            takeProfit: takeProfitAmount?.toString() || null,
                            maxWager: maxWager.toString(),
                            gameType,
                            trashTalk,
                            agentMode,
                            targetArchetype: agentMode === 'PvP_Target' ? targetArchetype : null,
                            sessionWalletOverride: newSessionWallet,
                            signature: regSignature,
                            timestamp: regTimestamp
                        })
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to record session');

                    console.log('✅ Agent registered successfully:', data);
                    setSessionRecorded(true);

                    // 🚀 AUTOMATICALLY START THE AGENT
                    if (data.session && data.session.id) {
                        console.log('🤖 Starting agent automatically...');

                        // Sign Start
                        const startTimestamp = Date.now();
                        const startMessage = `Pontiff Action: start_agent at ${startTimestamp}`;
                        const startSignature = await signMessageAsync({ message: startMessage });

                        const startRes = await fetch('/api/agents/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sessionId: data.session.id,
                                sessionWallet: newSessionWallet,
                                strategy: strategy,
                                signature: startSignature,
                                timestamp: startTimestamp
                            })
                        });

                        const startData = await startRes.json();
                        console.log('✅ Agent auto-started:', startData);
                        showToast('Agent deployed', 'success', `${agent.name} is now active and playing`, 7000);
                    }

                    // Close modal and redirect
                    onClose();
                    router.push('/dashboard');

                } catch (error: any) {
                    console.error('❌ Failed to register/start agent:', error);
                    setSessionRecorded(true);
                    showToast('Agent start failed', 'error', error.message);
                    onClose();
                    router.push('/dashboard');
                }
            };

            registerAndStart();
        }
    }, [isFundingSuccess, fundingHash, sessionRecorded, newSessionWallet, address, spawnHash, agent, strategy, deposit, stopLossAmount, takeProfitAmount, maxWager, gameType, trashTalk, agentMode, targetArchetype, onClose, router, signMessageAsync]); // Added signMessageAsync

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
        if (isSpawnPending) return { disabled: true, text: 'Confirm Spawn...' };
        if (isSpawnConfirming) return { disabled: true, text: 'Creating Session...' };

        // Funding states
        if (isSpawnConfirmed && !newSessionWallet) return { disabled: true, text: 'Locating Wallet...' };
        if (isFundingPending) return { disabled: true, text: 'Confirm Deposit...' };
        if (isFundingConfirming) return { disabled: true, text: 'Funding Session...' };

        return { disabled: false, text: 'SPAWN AGENT' };
    };

    if (!isOpen) return null;

    const buttonState = getButtonState();

    // ==========================================
    // STEPPER UI
    // ==========================================
    const [currentStep, setCurrentStep] = useState<number>(1);
    // Steps: 1=Config, 2=Approve, 3=Spawn, 4=Fund

    // Auto-advance logic
    useEffect(() => {
        if (currentStep === 1 && isAffordable && termsAccepted) {
            // User manually clicks Next
        }
        if (currentStep === 2 && isApproved) {
            setCurrentStep(3);
        }
        if (currentStep === 3 && isSpawnConfirmed && newSessionWallet) {
            setCurrentStep(4);
        }
    }, [isApproved, isSpawnConfirmed, newSessionWallet, currentStep, isAffordable, termsAccepted]);


    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-6 px-2">
            {[1, 2, 3, 4].map((step) => {
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                let label = '';
                if (step === 1) label = 'Config';
                if (step === 2) label = 'Approve';
                if (step === 3) label = 'Spawn';
                if (step === 4) label = 'Fund';

                return (
                    <div key={step} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 border-2 
                            ${isActive ? 'bg-[#D4AF37] border-[#D4AF37] text-black scale-110' :
                                isCompleted ? 'bg-green-600 border-green-600 text-white' :
                                    'bg-black border-gray-600 text-gray-500'}`}>
                            {isCompleted ? '✓' : step}
                        </div>
                        <span className={`text-[10px] mt-1 font-mono uppercase tracking-wider ${isActive ? 'text-[#D4AF37]' : isCompleted ? 'text-green-500' : 'text-gray-600'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
            {/* Progress Bar Background */}
            <div className="absolute top-9 left-0 w-full h-0.5 bg-gray-800 -z-0" />
            {/* Progress Bar Fill */}
            <div
                className="absolute top-9 left-0 h-0.5 bg-gradient-to-r from-green-600 to-[#D4AF37] transition-all duration-500 -z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
        </div>
    );

    // ... (keep existing render logic for content inside steps)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#2C2C2C] border-2 border-[#D4AF37] rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden font-inter text-white">

                {/* Header */}
                <div className="p-4 border-b border-[#D4AF37] bg-black flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{agent.icon}</span>
                        <div>
                            <h2 className="text-xl font-bold font-cinzel text-[#D4AF37]">
                                {currentStep === 1 ? `Configure ${agent.name}` :
                                    currentStep === 2 ? 'Approve $GUILT' :
                                        currentStep === 3 ? 'Summoning Agent...' : 'Initial Funding'}
                            </h2>
                            <p className="text-xs text-gray-300">
                                {isPvP ? '⚔️ GLADIATOR MODE' : '🏠 Grind House'} | Strategy: {Strategy[strategy]}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative">

                    {renderStepIndicator()}

                    {/* STEP 1: CONFIGURATION */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Mode Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-[#D4AF37]">Battle Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setAgentMode('PvE')}
                                        className={`p-3 rounded-lg border text-center transition-all duration-300 ${!isPvP
                                            ? 'bg-blue-900/30 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/30'
                                            : 'bg-black/30 border-gray-700 text-gray-500 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="text-lg mb-1">🏠</div>
                                        <div className="text-xs font-bold uppercase">Grind House</div>
                                        <div className="text-[10px] text-gray-500 mt-1">Play vs House</div>
                                    </button>
                                    <button
                                        onClick={() => setAgentMode('PvP_Any')}
                                        className={`p-3 rounded-lg border text-center transition-all duration-300 ${isPvP
                                            ? 'bg-obsidian border-[#D4AF37]/50 text-[#D4AF37] ring-1 ring-[#D4AF37]/30'
                                            : 'bg-black/30 border-gray-700 text-gray-500 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="text-lg mb-1">⚔️</div>
                                        <div className="text-xs font-bold uppercase">Gladiator</div>
                                        <div className="text-[10px] text-gray-500 mt-1">Agent vs Agent</div>
                                    </button>
                                </div>
                            </div>

                            {/* PvP Options */}
                            {isPvP && (
                                <div className="space-y-3 bg-obsidian border border-[#D4AF37]/20 rounded-lg p-4">
                                    <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">⚔️ Gladiator Settings</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setAgentMode('PvP_Any')} className={`p-2 rounded text-xs text-center transition-all ${agentMode === 'PvP_Any' ? 'bg-obsidian border border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-black/30 border border-gray-700 text-gray-500'}`}>Fight Anyone</button>
                                        <button onClick={() => setAgentMode('PvP_Target')} className={`p-2 rounded text-xs text-center transition-all ${agentMode === 'PvP_Target' ? 'bg-red-900/40 border border-red-500/50 text-red-400' : 'bg-black/30 border border-gray-700 text-gray-500'}`}>Hunt Archetype</button>
                                    </div>
                                    {agentMode === 'PvP_Target' && (
                                        <select value={targetArchetype} onChange={(e) => setTargetArchetype(e.target.value)} className="w-full bg-black/50 border border-red-900/50 rounded px-2 py-1.5 text-sm text-white focus:border-red-500 outline-none">
                                            <option value="">Any Archetype</option>
                                            <option value="berzerker">🗡️ Hunt Berzerkers</option>
                                            <option value="merchant">💰 Hunt Merchants</option>
                                            <option value="disciple">🙏 Hunt Disciples</option>
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Deposit Input */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-[#D4AF37]">Initial Funding</label>
                                    <span className={`text-sm font-mono ${getZoneColor(deposit)}`}>
                                        {deposit > 1000 ? 'DANGER ZONE' : deposit > 500 ? 'HIGH STAKES' : 'SAFE ZONE'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input type="range" min={MIN_DEPOSIT} max={maxDeposit} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                                    <div className="relative w-24">
                                        <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full bg-black border border-[#D4AF37]/50 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-[#D4AF37]" />
                                    </div>
                                </div>
                                <p className="text-xs text-right text-gray-400">Wallet Balance: {displayBalance.toFixed(0)} GUILT</p>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-black/40 p-3 rounded-lg space-y-1 text-sm border border-gray-800">
                                <div className="flex justify-between text-gray-400"><span>Initial Deposit</span><span>{deposit} GUILT</span></div>
                                <div className="flex justify-between text-gray-400"><span>Protocol Fee</span><span>{feeDisplay} GUILT</span></div>
                                <div className="flex justify-between text-[#D4AF37] font-bold border-t border-gray-700 pt-1 mt-1"><span>Total Required</span><span>{totalCostDisplay.toFixed(2)} GUILT</span></div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-2 pt-2">
                                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-[#D4AF37]" />
                                <label className="text-xs text-gray-400">I accept that this agent acts autonomously and effectively "owns" these funds. I can stop it to withdraw compatible funds.</label>
                            </div>

                            <button
                                onClick={() => isApproved ? setCurrentStep(3) : setCurrentStep(2)}
                                disabled={!termsAccepted || !isAffordable}
                                className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#C5A028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-cinzel text-lg shadow-lg"
                            >
                                {isApproved ? 'NEXT: SUMMON AGENT' : 'NEXT: APPROVE TOKENS'}
                            </button>

                            {!isAffordable && <p className="text-red-500 text-center text-xs">Insufficient Wallet Balance</p>}
                        </div>
                    )}

                    {/* STEP 2: APPROVAL */}
                    {currentStep === 2 && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
                            <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                                <span className="text-4xl">✍️</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#D4AF37]">Approve Token Usage</h3>
                                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                                    Please approve the factory contract to spend <strong>{totalCostDisplay} GUILT</strong> on your behalf.
                                </p>
                            </div>

                            {isApprovalConfirming ? (
                                <div className="flex flex-col items-center gap-2 text-[#D4AF37]">
                                    <div className="animate-spin text-2xl">⏳</div>
                                    <span className="text-xs font-mono">Confirming Transaction...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleApprove}
                                    disabled={isApprovalPending}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors w-full max-w-sm"
                                >
                                    {isApprovalPending ? 'Check Wallet...' : 'Approve GUILT'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* STEP 3: SPAWN */}
                    {currentStep === 3 && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
                            <div className="w-20 h-20 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                                <span className="text-4xl animate-pulse">🔮</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#D4AF37]">Summoning {agent.name}</h3>
                                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                                    Creating agent session on-chain. This will deploy a unique wallet for your agent.
                                </p>
                            </div>

                            {isSpawnConfirming ? (
                                <div className="flex flex-col items-center gap-2 text-purple-400">
                                    <div className="animate-spin text-2xl">⚡</div>
                                    <span className="text-xs font-mono">Deploying Agent Contract...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSpawn}
                                    disabled={isSpawnPending}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white font-bold rounded-lg transition-colors w-full max-w-sm shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                                >
                                    {isSpawnPending ? 'Check Wallet...' : 'Summon Agent'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* STEP 4: FUNDING */}
                    {currentStep === 4 && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
                            <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                                <span className="text-4xl">💰</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-400">Agent Deployed!</h3>
                                <p className="text-sm text-gray-300 mt-1 font-mono text-xs break-all bg-black/50 p-2 rounded">
                                    {newSessionWallet}
                                </p>
                                <p className="text-sm text-gray-400 mt-4 max-w-sm mx-auto">
                                    Final Step: Transfer <strong>{deposit} GUILT</strong> to the agent's wallet to activate it.
                                </p>
                            </div>

                            {isFundingConfirming ? (
                                <div className="flex flex-col items-center gap-2 text-green-400">
                                    <div className="animate-spin text-2xl">💸</div>
                                    <span className="text-xs font-mono">Transferring Funds...</span>
                                </div>
                            ) : isFundingSuccess ? (
                                <div className="text-green-500 font-bold text-lg animate-bounce">
                                    Launch Successful!
                                </div>
                            ) : (
                                <p className="text-xs text-yellow-500 animate-pulse">
                                    Check your wallet to confirm the transfer...
                                </p>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
