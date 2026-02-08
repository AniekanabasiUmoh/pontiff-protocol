'use client'

import { formatEther } from 'viem'

interface StatsBarProps {
    totalStaked: bigint
    currentAPY: number
    totalStakers: number
    epochNumber: number
    epochEndTime: number
}

export function StatsBar({
    totalStaked,
    currentAPY,
    totalStakers,
    epochNumber,
    epochEndTime,
}: StatsBarProps) {
    const formatLargeNumber = (num: bigint) => {
        const value = Number(formatEther(num))
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`
        }
        return `$${value.toFixed(0)}`
    }

    const getTimeToEpoch = () => {
        const now = Date.now()
        const remaining = Math.max(0, epochEndTime - now)
        const hours = Math.floor(remaining / (1000 * 60 * 60))
        return `${hours}h`
    }

    return (
        <div className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-4 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Total Staked */}
                <div className="text-center">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Total Staked</p>
                    <p className="text-[#00ff00] font-bold text-lg font-orbitron">
                        {formatLargeNumber(totalStaked)}
                    </p>
                </div>

                {/* Current APY */}
                <div className="text-center">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Current APY</p>
                    <p className="text-[#00ff00] font-bold text-lg font-orbitron">{currentAPY}%</p>
                </div>

                {/* Total Stakers */}
                <div className="text-center">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Total Stakers</p>
                    <p className="text-[#8B0000] font-bold text-lg font-orbitron">
                        {totalStakers.toLocaleString()}
                    </p>
                </div>

                {/* Epoch Number */}
                <div className="text-center">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Epoch</p>
                    <p className="text-[#8B0000] font-bold text-lg font-orbitron">#{epochNumber}</p>
                </div>

                {/* Time to Next Epoch */}
                <div className="text-center">
                    <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Next Epoch</p>
                    <p className="text-[#8B0000] font-bold text-lg font-orbitron">{getTimeToEpoch()}</p>
                </div>
            </div>
        </div>
    )
}
