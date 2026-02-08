'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatEther, parseEther } from 'viem'

interface StakingPanelProps {
    userBalance: bigint
    stakedBalance: bigint
    currentAPY: number
    onDeposit: (amount: bigint) => Promise<void>
    onWithdraw: (amount: bigint) => Promise<void>
}

export function StakingPanel({
    userBalance,
    stakedBalance,
    currentAPY,
    onDeposit,
    onWithdraw,
}: StakingPanelProps) {
    const [amount, setAmount] = useState('')
    const [isDepositing, setIsDepositing] = useState(false)
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')

    const calculateProjectedYield = (depositAmount: string, days: number = 365) => {
        if (!depositAmount || isNaN(Number(depositAmount))) return '0'
        const amount = Number(depositAmount)
        const yield_ = (amount * currentAPY * days) / (365 * 100)
        return yield_.toFixed(2)
    }

    const handleDeposit = async () => {
        if (!amount || isNaN(Number(amount))) return

        setIsDepositing(true)
        try {
            await onDeposit(parseEther(amount))
            setAmount('')
        } catch (error) {
            console.error('Deposit failed:', error)
        } finally {
            setIsDepositing(false)
        }
    }

    const handleWithdraw = async () => {
        if (!amount || isNaN(Number(amount))) return

        setIsWithdrawing(true)
        try {
            await onWithdraw(parseEther(amount))
            setAmount('')
        } catch (error) {
            console.error('Withdraw failed:', error)
        } finally {
            setIsWithdrawing(false)
        }
    }

    const setMaxAmount = () => {
        if (activeTab === 'deposit') {
            setAmount(formatEther(userBalance))
        } else {
            setAmount(formatEther(stakedBalance))
        }
    }

    return (
        <div className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-6 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
            {/* Title */}
            <h2 className="text-2xl font-bold text-[#8B0000] mb-6 font-cinzel">
                STAKING CATHEDRAL
            </h2>

            {/* Balance Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded border border-[#8B0000]/30">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Wallet Balance</p>
                    <p className="text-[#8B0000] font-bold text-lg font-orbitron">
                        {formatEther(userBalance)} GUILT
                    </p>
                </div>
                <div className="bg-[#0a0a0a] p-4 rounded border border-[#8B0000]/30">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Staked Balance</p>
                    <p className="text-[#00ff00] font-bold text-lg font-orbitron">
                        {formatEther(stakedBalance)} GUILT
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('deposit')}
                    className={`flex-1 py-2 rounded font-cinzel transition-all ${activeTab === 'deposit'
                            ? 'bg-[#8B0000] text-white'
                            : 'bg-[#0a0a0a] text-[#e0e0e0]/50 hover:text-[#e0e0e0]'
                        }`}
                >
                    DEPOSIT
                </button>
                <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex-1 py-2 rounded font-cinzel transition-all ${activeTab === 'withdraw'
                            ? 'bg-[#8B0000] text-white'
                            : 'bg-[#0a0a0a] text-[#e0e0e0]/50 hover:text-[#e0e0e0]'
                        }`}
                >
                    WITHDRAW
                </button>
            </div>

            {/* Input */}
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#8B0000]/50 rounded-lg text-[#e0e0e0] placeholder-[#e0e0e0]/30 focus:outline-none focus:border-[#8B0000] focus:shadow-[0_0_20px_rgba(139,0,0,0.5)] transition-all font-orbitron text-lg"
                    />
                    <button
                        onClick={setMaxAmount}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#8B0000]/20 hover:bg-[#8B0000]/40 border border-[#8B0000] rounded text-xs text-[#8B0000] transition-all font-cinzel"
                    >
                        MAX
                    </button>
                </div>
            </div>

            {/* Projected Yield */}
            {activeTab === 'deposit' && amount && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-[#0a0a0a] rounded border border-[#00ff00]/30"
                >
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Projected Yearly Yield</p>
                    <p className="text-[#00ff00] font-bold font-orbitron">
                        +{calculateProjectedYield(amount)} GUILT
                    </p>
                    <p className="text-[#e0e0e0]/30 text-xs mt-1 font-inter">
                        at {currentAPY}% APY
                    </p>
                </motion.div>
            )}

            {/* Action Button */}
            <motion.button
                onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                disabled={!amount || isDepositing || isWithdrawing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[#8B0000] hover:bg-[#a00000] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(139,0,0,0.5)] hover:shadow-[0_0_30px_rgba(139,0,0,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-cinzel text-lg"
            >
                {isDepositing
                    ? 'DEPOSITING...'
                    : isWithdrawing
                        ? 'WITHDRAWING...'
                        : activeTab === 'deposit'
                            ? 'DEPOSIT GUILT'
                            : 'WITHDRAW GUILT'}
            </motion.button>

            {/* APY Display */}
            <div className="mt-6 p-4 bg-[#0a0a0a] rounded border border-[#8B0000]/30 text-center">
                <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Current APY</p>
                <p className="text-[#00ff00] font-bold text-3xl font-orbitron">{currentAPY}%</p>
            </div>
        </div>
    )
}
