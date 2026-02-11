'use client'

import { useState } from 'react'
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            })
            if (!response.ok) throw new Error('Failed to generate writ')
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
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {!writImage && !isScanning && (
                    <>
                        {/* ─── Header ─── */}
                        <div className="text-center pt-8">
                            <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-3">Ritual // Soul_Scan</p>

                            {/* Papal Seal */}
                            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons text-primary text-4xl">church</span>
                            </div>

                            <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-2">
                                The <span className="text-primary text-gold-glow">Confessional</span>
                            </h1>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                Submit your wallet address for divine judgment. The Pontiff shall scan your on-chain sins and issue a Writ of Absolution.
                            </p>
                        </div>

                        {/* ─── Input Card ─── */}
                        <div className="bg-obsidian border border-primary/20 rounded-xl p-8 shadow-[0_0_40px_-10px_rgba(242,185,13,0.1)]">
                            <WalletInput
                                value={walletAddress}
                                onChange={setWalletAddress}
                                onSubmit={handleConfess}
                                isLoading={isScanning}
                            />

                            {error && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-center text-xs font-mono">
                                    ✗ {error}
                                </div>
                            )}
                        </div>

                        {/* ─── Info ─── */}
                        <div className="text-center text-gray-600 text-[11px] font-mono space-y-1">
                            <p>Your wallet is scanned for on-chain activity across multiple protocols</p>
                            <p className="text-primary/30">&ldquo;All sins are visible on the immutable ledger.&rdquo;</p>
                        </div>
                    </>
                )}

                {isScanning && <ScanningAnimation />}

                {writImage && (
                    <WritDisplay
                        imageUrl={writImage}
                        walletAddress={walletAddress}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    )
}
