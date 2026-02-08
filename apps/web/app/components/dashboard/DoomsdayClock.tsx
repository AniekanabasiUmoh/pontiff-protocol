'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DoomsdayClockProps {
    epochEndTime: number
}

export function DoomsdayClock({ epochEndTime }: DoomsdayClockProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0)
    const [isPanicMode, setIsPanicMode] = useState<boolean>(false)

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            const remaining = Math.max(0, epochEndTime - now)
            setTimeRemaining(remaining)

            // Panic mode when less than 10 minutes
            setIsPanicMode(remaining < 10 * 60 * 1000 && remaining > 0)
        }, 100)

        return () => clearInterval(interval)
    }, [epochEndTime])

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
        }
    }

    const time = formatTime(timeRemaining)
    const progress = timeRemaining > 0 ? (timeRemaining / (24 * 60 * 60 * 1000)) * 100 : 0

    return (
        <div className="relative">
            {/* Panic Mode Flash */}
            {isPanicMode && (
                <motion.div
                    animate={{
                        opacity: [0, 0.3, 0],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-red-500 rounded-lg pointer-events-none"
                />
            )}

            <div className="relative bg-[#0a0a0a] p-6 rounded-lg border-2 border-[#8B0000]">
                {/* Title */}
                <h3 className="text-center text-[#8B0000] font-cinzel font-bold mb-4">
                    {isPanicMode ? '⚠️ PANIC MODE ⚠️' : 'DOOMSDAY CLOCK'}
                </h3>

                {/* Circular Progress */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-48 h-48">
                        {/* Background Circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="#8B0000"
                                strokeWidth="8"
                                fill="none"
                                opacity="0.2"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke={isPanicMode ? '#ff0000' : '#8B0000'}
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 88}`}
                                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                animate={
                                    isPanicMode
                                        ? {
                                            stroke: ['#ff0000', '#8B0000', '#ff0000'],
                                        }
                                        : {}
                                }
                                transition={
                                    isPanicMode
                                        ? {
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }
                                        : {}
                                }
                            />
                        </svg>

                        {/* Time Display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="flex gap-1 font-orbitron text-4xl font-bold">
                                    <span className={isPanicMode ? 'text-red-500' : 'text-[#8B0000]'}>
                                        {time.hours}
                                    </span>
                                    <span className={isPanicMode ? 'text-red-500' : 'text-[#8B0000]'}>:</span>
                                    <span className={isPanicMode ? 'text-red-500' : 'text-[#8B0000]'}>
                                        {time.minutes}
                                    </span>
                                    <span className={isPanicMode ? 'text-red-500' : 'text-[#8B0000]'}>:</span>
                                    <span className={isPanicMode ? 'text-red-500' : 'text-[#8B0000]'}>
                                        {time.seconds}
                                    </span>
                                </div>
                                <p className="text-[#e0e0e0]/50 text-xs mt-2 font-inter">
                                    {timeRemaining === 0 ? 'EPOCH ENDED' : 'Until Judgment'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panic Warning */}
                {isPanicMode && (
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-center text-red-500 font-bold font-cinzel"
                    >
                        FINAL MINUTES TO BETRAY!
                    </motion.p>
                )}

                {/* Atmospheric Quote */}
                {!isPanicMode && (
                    <p className="text-center text-[#e0e0e0]/40 text-sm italic font-cinzel mt-4">
                        "Time runs short for the faithful..."
                    </p>
                )}
            </div>
        </div>
    )
}
