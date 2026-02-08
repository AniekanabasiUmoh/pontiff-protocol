'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WalletInput } from '../components/confess/WalletInput'
import { ScanningAnimation } from '../components/confess/ScanningAnimation'
import { WritDisplay } from '../components/confess/WritDisplay'

export default function ConfessPage() {
    const [walletAddress, setWalletAddress] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [writImage, setWritImage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleConfess = async () => {
        if (!walletAddress) return

        setIsScanning(true)
        setError(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/confess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate writ')
            }

            const data = await response.json()
            setWritImage(data.data.writUrl)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsScanning(false)
        }
    }

    const handleReset = () => {
        setWalletAddress('')
        setWritImage(null)
        setError(null)
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
            {/* Header with WalletConnect */}
            <header className="border-b border-[#8B0000]/20 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[#8B0000] font-cinzel">
                        THE PONTIFF
                    </h1>
                    {/* WalletConnect button will go here */}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto"
                >
                    {!writImage && !isScanning && (
                        <div className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-8 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
                            {/* Papal Seal */}
                            <div className="flex justify-center mb-8">
                                <div className="w-32 h-32 rounded-full bg-[#8B0000]/10 border-2 border-[#8B0000] flex items-center justify-center">
                                    <span className="text-6xl">⛪</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-4xl font-bold text-center mb-2 font-cinzel text-[#8B0000]">
                                THE CONFESSIONAL
                            </h2>
                            <p className="text-center text-[#e0e0e0]/70 mb-8 font-inter">
                                Confess your crypto sins and receive divine judgment
                            </p>

                            {/* Wallet Input */}
                            <WalletInput
                                value={walletAddress}
                                onChange={setWalletAddress}
                                onSubmit={handleConfess}
                                isLoading={isScanning}
                            />

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded text-red-400 text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {isScanning && <ScanningAnimation />}

                    {writImage && (
                        <WritDisplay
                            imageUrl={writImage}
                            walletAddress={walletAddress}
                            onReset={handleReset}
                        />
                    )}
                </motion.div>
            </main>
        </div>
    )
}
