'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BetrayButtonProps {
    userHasBetrayed: boolean
    onBetray: () => Promise<void>
    disabled?: boolean
}

export function BetrayButton({ userHasBetrayed, onBetray, disabled }: BetrayButtonProps) {
    const [showModal, setShowModal] = useState(false)
    const [isBetraying, setIsBetraying] = useState(false)

    const handleBetrayClick = () => {
        if (userHasBetrayed || disabled) return
        setShowModal(true)
    }

    const handleConfirm = async () => {
        setIsBetraying(true)
        try {
            await onBetray()
            setShowModal(false)
        } catch (error) {
            console.error('Betrayal failed:', error)
        } finally {
            setIsBetraying(false)
        }
    }

    return (
        <>
            {/* Betray Button */}
            <motion.button
                onClick={handleBetrayClick}
                disabled={userHasBetrayed || disabled}
                whileHover={!userHasBetrayed && !disabled ? { scale: 1.05 } : {}}
                whileTap={!userHasBetrayed && !disabled ? { scale: 0.95 } : {}}
                animate={
                    !userHasBetrayed && !disabled
                        ? {
                            boxShadow: [
                                '0 0 20px rgba(255, 0, 0, 0.5)',
                                '0 0 40px rgba(255, 0, 0, 0.8)',
                                '0 0 20px rgba(255, 0, 0, 0.5)',
                            ],
                        }
                        : {}
                }
                transition={
                    !userHasBetrayed && !disabled
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }
                        : {}
                }
                className={`w-full py-6 rounded-lg font-cinzel text-2xl font-bold transition-all ${userHasBetrayed
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : disabled
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
            >
                {userHasBetrayed ? '✓ FAITH BETRAYED' : 'BETRAY FAITH'}
            </motion.button>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={() => !isBetraying && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1a1a1a] border-2 border-red-500 rounded-lg p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,0,0,0.5)]"
                        >
                            {/* Skull Icon */}
                            <div className="text-center mb-6">
                                <span className="text-6xl">💀</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-red-500 text-center mb-4 font-cinzel">
                                BETRAY YOUR FAITH?
                            </h3>

                            {/* Warning Text */}
                            <div className="space-y-3 mb-6 text-[#e0e0e0]/80 font-inter">
                                <p className="text-center">
                                    This action <span className="text-red-500 font-bold">cannot be undone</span>.
                                </p>
                                <p className="text-center">
                                    You will join the ranks of the betrayers and risk divine punishment.
                                </p>
                                <p className="text-center text-sm text-[#e0e0e0]/50">
                                    If too many betray, all will suffer the Sin Tax.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={isBetraying}
                                    className="flex-1 py-3 bg-[#0a0a0a] hover:bg-[#2a2a2a] border-2 border-[#8B0000] text-[#e0e0e0] font-bold rounded-lg transition-all disabled:opacity-50 font-cinzel"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isBetraying}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.5)] transition-all disabled:opacity-50 font-cinzel"
                                >
                                    {isBetraying ? 'BETRAYING...' : 'BETRAY FAITH'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
