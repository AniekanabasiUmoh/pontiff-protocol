/**
 * Create Session Widget
 * UI for creating autonomous agent sessions
 * Part of Module 5: Session Wallet System
 */

'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

type AgentStrategy = 'berzerker' | 'merchant' | 'disciple';

interface CreateSessionWidgetProps {
    userWallet?: string;
    guiltBalance?: number;
    onSessionCreated?: (sessionWallet: string) => void;
}

const STRATEGIES = {
    berzerker: {
        name: 'Berzerker',
        icon: '⚔️',
        description: 'High risk, high reward. Bets 15% of balance per game.',
        riskLevel: 'HIGH',
        color: 'red'
    },
    merchant: {
        name: 'Merchant',
        icon: '💰',
        description: 'Medium risk. Bets 5% of balance with strategic moves.',
        riskLevel: 'MEDIUM',
        color: 'yellow'
    },
    disciple: {
        name: 'Disciple',
        icon: '🙏',
        description: 'Low risk. Bets 2% of balance conservatively.',
        riskLevel: 'LOW',
        color: 'green'
    }
};

export default function CreateSessionWidget({
    userWallet,
    guiltBalance = 0,
    onSessionCreated
}: CreateSessionWidgetProps) {
    const [strategy, setStrategy] = useState<AgentStrategy>('merchant');
    const [depositAmount, setDepositAmount] = useState<string>('100');
    const [stopLoss, setStopLoss] = useState<string>('50');
    const [takeProfit, setTakeProfit] = useState<string>('200');
    const [useTakeProfit, setUseTakeProfit] = useState(false);
    const [duration, setDuration] = useState<number>(24);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'config' | 'confirm' | 'creating'>('config');

    const selectedStrategy = STRATEGIES[strategy];
    const depositNum = parseFloat(depositAmount) || 0;
    const stopLossNum = parseFloat(stopLoss) || 0;
    const takeProfitNum = parseFloat(takeProfit) || 0;
    const sessionFee = depositNum * 0.01; // 1% fee
    const totalCost = depositNum + sessionFee;

    const handleCreateSession = async () => {
        setError(null);
        setIsCreating(true);
        setStep('creating');

        try {
            // Validation
            if (!userWallet) {
                throw new Error('Please connect your wallet first');
            }

            if (depositNum <= 0) {
                throw new Error('Deposit amount must be greater than 0');
            }

            if (stopLossNum >= depositNum) {
                throw new Error('Stop loss must be less than deposit amount');
            }

            if (totalCost > guiltBalance) {
                throw new Error(`Insufficient GUILT balance. Need ${totalCost.toFixed(2)}, have ${guiltBalance.toFixed(2)}`);
            }

            // Step 1: Get session parameters from API
            const response = await fetch('/api/sessions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userWallet,
                    strategy,
                    depositAmount: depositNum,
                    stopLoss: stopLossNum,
                    takeProfit: useTakeProfit ? takeProfitNum : null,
                    durationHours: duration
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create session');
            }

            const { params, metadata } = await response.json();

            // Step 2: Call smart contract (would be done via wagmi/ethers in real implementation)
            // For now, simulate the contract call
            console.log('Creating session with params:', params);

            // In real implementation:
            // 1. User approves GUILT token spend
            // 2. User calls SessionWalletFactory.createSession()
            // 3. Get sessionWallet address from event
            // 4. Call /api/sessions/start to spawn agent

            // Simulated session wallet address for development
            const mockSessionWallet = `0x${Math.random().toString(16).slice(2, 42)}`;

            // Step 3: Start the agent
            const startResponse = await fetch('/api/sessions/create', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionWallet: mockSessionWallet,
                    userWallet,
                    strategy,
                    depositAmount: depositNum,
                    stopLoss: stopLossNum,
                    takeProfit: useTakeProfit ? takeProfitNum : null
                })
            });

            if (!startResponse.ok) {
                throw new Error('Failed to start agent');
            }

            const { sessionId } = await startResponse.json();
            console.log('Agent started with session ID:', sessionId);

            // Success!
            if (onSessionCreated) {
                onSessionCreated(mockSessionWallet);
            }

            // Reset form
            setStep('config');
            setDepositAmount('100');
            setStopLoss('50');
            setTakeProfit('200');
            setUseTakeProfit(false);

        } catch (err: any) {
            console.error('Session creation error:', err);
            setError(err.message || 'Failed to create session');
            setStep('config');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-500 mb-2">
                🤖 Spawn AI Agent
            </h2>
            <p className="text-gray-400 text-sm mb-6">
                Create an autonomous agent to play games for you for {duration} hours
            </p>

            {step === 'config' && (
                <>
                    {/* Strategy Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-300 mb-3">
                            Select Strategy
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(STRATEGIES) as AgentStrategy[]).map((strat) => {
                                const s = STRATEGIES[strat];
                                return (
                                    <button
                                        key={strat}
                                        onClick={() => setStrategy(strat)}
                                        className={`p-4 rounded border-2 transition-all ${
                                            strategy === strat
                                                ? `border-${s.color}-500 bg-${s.color}-900/20`
                                                : 'border-gray-700 bg-black/30 hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="text-3xl mb-2">{s.icon}</div>
                                        <div className="text-sm font-bold text-white mb-1">
                                            {s.name}
                                        </div>
                                        <div className={`text-xs font-bold text-${s.color}-400`}>
                                            {s.riskLevel} RISK
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {selectedStrategy.description}
                        </p>
                    </div>

                    {/* Deposit Amount */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Deposit Amount (GUILT)
                        </label>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded px-4 py-3 text-white"
                            placeholder="100"
                            min="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Available: {guiltBalance.toFixed(2)} GUILT
                        </p>
                    </div>

                    {/* Stop Loss */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Stop Loss (GUILT)
                        </label>
                        <input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded px-4 py-3 text-white"
                            placeholder="50"
                            min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Agent stops if balance drops to this level
                        </p>
                    </div>

                    {/* Take Profit (Optional) */}
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-bold text-gray-300 mb-2">
                            <input
                                type="checkbox"
                                checked={useTakeProfit}
                                onChange={(e) => setUseTakeProfit(e.target.checked)}
                                className="mr-2"
                            />
                            Take Profit (Optional)
                        </label>
                        {useTakeProfit && (
                            <input
                                type="number"
                                value={takeProfit}
                                onChange={(e) => setTakeProfit(e.target.value)}
                                className="w-full bg-black/50 border border-gray-700 rounded px-4 py-3 text-white"
                                placeholder="200"
                                min={depositNum}
                            />
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Agent stops if balance reaches this level
                        </p>
                    </div>

                    {/* Duration */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Duration (Hours)
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full bg-black/50 border border-gray-700 rounded px-4 py-3 text-white"
                        >
                            <option value={1}>1 Hour (Test)</option>
                            <option value={6}>6 Hours</option>
                            <option value={12}>12 Hours</option>
                            <option value={24}>24 Hours (Recommended)</option>
                            <option value={48}>48 Hours</option>
                            <option value={168}>1 Week</option>
                        </select>
                    </div>

                    {/* Cost Summary */}
                    <div className="bg-black/50 border border-gray-700 rounded p-4 mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Deposit:</span>
                            <span className="text-white font-bold">{depositNum.toFixed(2)} GUILT</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Session Fee (1%):</span>
                            <span className="text-yellow-500 font-bold">{sessionFee.toFixed(2)} GUILT</span>
                        </div>
                        <div className="border-t border-gray-700 my-2"></div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300 font-bold">Total:</span>
                            <span className="text-red-500 font-bold text-lg">{totalCost.toFixed(2)} GUILT</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Create Button */}
                    <button
                        onClick={() => setStep('confirm')}
                        disabled={!userWallet || depositNum <= 0 || stopLossNum >= depositNum}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded transition-colors"
                    >
                        {userWallet ? 'Create Session' : 'Connect Wallet First'}
                    </button>
                </>
            )}

            {step === 'confirm' && (
                <div className="text-center">
                    <div className="text-6xl mb-4">{selectedStrategy.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        Confirm {selectedStrategy.name} Agent
                    </h3>
                    <p className="text-gray-400 mb-6">
                        Your agent will play for {duration} hours with a {depositNum.toFixed(2)} GUILT budget
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('config')}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateSession}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded"
                        >
                            Confirm & Deploy
                        </button>
                    </div>
                </div>
            )}

            {step === 'creating' && (
                <div className="text-center py-8">
                    <div className="animate-spin text-6xl mb-4">⚙️</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        Spawning Agent...
                    </h3>
                    <p className="text-gray-400">
                        Please wait while we create your session wallet
                    </p>
                </div>
            )}
        </div>
    );
}
