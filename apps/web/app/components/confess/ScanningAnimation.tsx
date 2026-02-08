'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const scanningStages = [
    { text: 'Connecting to the Divine...', progress: 0 },
    { text: 'Scanning blockchain sins...', progress: 25 },
    { text: 'Consulting the archives...', progress: 50 },
    { text: 'Preparing your judgment...', progress: 75 },
    { text: 'Finalizing your Writ...', progress: 95 },
]

export function ScanningAnimation() {
    const [currentStage, setCurrentStage] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStage((prev) => {
                if (prev < scanningStages.length - 1) {
                    return prev + 1
                }
                return prev
            })
        }, 800) // Change stage every 800ms

        return () => clearInterval(interval)
    }, [])

    const stage = scanningStages[currentStage]

    return (
        <div className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-12 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
            {/* Title */}
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl font-bold text-center mb-8 font-cinzel text-[#8B0000]"
            >
                SCANNING SOUL...
            </motion.h2>

            {/* Rotating Papal Seal */}
            <div className="flex justify-center mb-8">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        },
                        scale: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        },
                    }}
                    className="w-40 h-40 rounded-full bg-[#8B0000]/10 border-4 border-[#8B0000] flex items-center justify-center relative"
                    style={{
                        boxShadow: '0 0 40px rgba(139, 0, 0, 0.8), inset 0 0 20px rgba(139, 0, 0, 0.5)',
                    }}
                >
                    <span className="text-7xl">⛪</span>

                    {/* Pulsing Glow */}
                    <motion.div
                        animate={{
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute inset-0 rounded-full bg-[#8B0000]/20 blur-xl"
                    />
                </motion.div>
            </div>

            {/* Progress Text */}
            <motion.p
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-[#e0e0e0] mb-6 font-inter text-lg"
            >
                {stage.text}
            </motion.p>

            {/* Progress Bar */}
            <div className="w-full bg-[#0a0a0a] rounded-full h-3 overflow-hidden border border-[#8B0000]/30">
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${stage.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#8B0000] to-[#ff0000] shadow-[0_0_10px_rgba(139,0,0,0.8)]"
                />
            </div>

            {/* Progress Percentage */}
            <motion.p
                key={stage.progress}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[#8B0000] mt-4 font-mono text-sm"
            >
                {stage.progress}%
            </motion.p>

            {/* Atmospheric Text */}
            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center text-[#e0e0e0]/40 mt-8 font-cinzel text-sm italic"
            >
                "The truth shall be revealed..."
            </motion.p>
        </div>
    )
}
