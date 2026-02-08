'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { SiweMessage } from 'siwe'
import { createClient } from '@supabase/supabase-js'

interface RoastData {
    sins: string[]
    verdict: string
    penance: string
    score: number
}

export function Confessional() {
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const [status, setStatus] = useState<'idle' | 'scanning' | 'roasted'>('idle')
    const [roast, setRoast] = useState<RoastData | null>(null)

    // Trigger scanning upon mounting if connected
    useEffect(() => {
        if (isConnected && status === 'idle') {
            startScanning()
        }
    }, [isConnected])

    const startScanning = async () => {
        setStatus('scanning')

        try {
            // Call the real Pontiff API
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            const response = await fetch(`${apiUrl}/api/confess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress: address }),
            })

            if (!response.ok) {
                throw new Error('Failed to fetch confession')
            }

            const data = await response.json()

            // Map API response to UI format
            // API returns: { confession: { roast, sins, primarySin, ... } }
            if (data.success && data.confession) {
                // If sins is empty, provide a cleaner default verdict than "FOMO DEGEN"
                let verdict = data.confession.primarySin.replace('_', ' ').toUpperCase()
                if (data.confession.sins.length === 0) {
                    const cleanVerdicts = ["PURE SOUL", "UNTOUCHED", "WAITING TO SIN", "FRESH MEAT", "TABULA RASA"]
                    verdict = cleanVerdicts[Math.floor(Math.random() * cleanVerdicts.length)]
                }

                setRoast({
                    // Use the actual AI roast text here
                    sins: data.confession.sins.length > 0
                        ? data.confession.sins.map((s: any) => `${s.token_symbol}: -$${s.loss_amount_usd.toFixed(2)} (${s.sin_type})`)
                        : [data.confession.roast], // Show roast as the main item for clean wallets
                    verdict: verdict,
                    penance: data.confession.sins.length > 0
                        ? "Stake 1000 $GUILT or remain cursed forever."
                        : "Maintain thy purity. Stake $GUILT to earn divine yield.",
                    score: Math.floor(data.confession.totalLoss),
                    imageUrl: data.confession.writImageUrl // Capture image URL
                })
                setStatus('roasted')
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error) {
            console.error('Confession failed:', error)
            // Fallback to a generic error state or local mock if API fails
            // For now, we want to know if it fails, so we'll show a fallback message
            setRoast({
                sins: ["API Connection Failed", "The Pontiff is sleeping", "Try again later"],
                verdict: "CONNECTION ERROR",
                penance: "Ensure the API server is running on port 3001.",
                score: 0
            })
            setStatus('roasted')
        }
    }

    const handleShare = () => {
        const text = `I have confessed my sins to The Pontiff. My soul is worth $${roast?.score} (Losses). Can you survive the judgment?`
        const url = 'https://pontiff.xyz'
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    }

    if (!isConnected) {
        return null // Should be handled by parent
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-1 relative z-50">
            {/* Background Container */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-xl border border-red-900/50 shadow-[0_0_50px_rgba(139,0,0,0.5)] z-0" />

            <div className="relative z-10 p-8 text-center font-cinzel text-red-100 min-h-[400px] flex flex-col justify-center items-center">

                {/* Header */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => disconnect()}
                        className="text-xs text-zinc-500 hover:text-red-500 transition-colors font-mono"
                    >
                        [Sign Out]
                    </button>
                </div>

                {/* STATUS: SCANNING */}
                {status === 'scanning' && (
                    <div className="space-y-6 animate-pulse">
                        <h2 className="text-3xl font-bold text-red-500 tracking-widest animate-bounce">
                            SCANNING SOUL...
                        </h2>
                        <div className="w-64 h-2 bg-red-900/30 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-red-600 animate-[width_3s_ease-in-out_infinite]" style={{ width: '100%' }} />
                        </div>
                        <div className="font-mono text-sm text-red-400/70 space-y-1">
                            <p>Reading chain history...</p>
                            <p>Detecting rug pulls...</p>
                            <p>Calculating paper hands score...</p>
                        </div>
                    </div>
                )}

                {/* STATUS: ROASTED */}
                {status === 'roasted' && roast && (
                    <div className="space-y-8 w-full animate-in fade-in zoom-in duration-1000">
                        {/* The Writ - Show Image if available, otherwise CSS fallback */}
                        {roast.imageUrl ? (
                            <div className="relative group">
                                <img
                                    src={roast.imageUrl}
                                    alt="Writ of Sin"
                                    className="w-full rounded-lg shadow-2xl border-2 border-red-900/50 hover:scale-[1.02] transition-transform duration-500"
                                />
                                <div className="absolute -bottom-6 left-0 w-full text-center">
                                    <p className="text-xs text-zinc-500 font-mono italic">
                                        Right-click or hold to save your Writ
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="border-4 border-double border-red-900/40 p-8 bg-[url('/parchment-texture.png')] bg-cover bg-neutral-900/50 rounded-lg shadow-inner">
                                <h2 className="text-4xl font-black text-red-600 mb-6 drop-shadow-md border-b border-red-900/30 pb-4">
                                    WRIT OF SIN
                                </h2>

                                <div className="text-left space-y-4 mb-8">
                                    <h3 className="text-xl text-red-400 font-bold">Identified Transgressions:</h3>
                                    <ul className="list-disc list-inside space-y-2 text-zinc-300 font-mono text-sm">
                                        {roast.sins.map((sin, i) => (
                                            <li key={i} className="text-red-200/80">{sin}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mb-8">
                                    <p className="text-xs text-red-500 uppercase tracking-widest mb-2 font-mono">Verdict</p>
                                    <p className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                                        "{roast.verdict}"
                                    </p>
                                </div>

                                <div className="bg-black/40 p-4 rounded border border-red-900/30">
                                    <p className="text-sm text-zinc-400 mb-1">Penance Required:</p>
                                    <p className="text-lg text-red-400 italic">
                                        {roast.penance}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handleShare}
                                className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 px-6 py-3 rounded-md font-mono text-sm transition-all hover:scale-105"
                            >
                                Share on X
                            </button>
                            <button
                                className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 text-red-300 px-6 py-3 rounded-md font-mono text-sm transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(220,20,60,0.4)]"
                            >
                                Repent Now (Stake) &rarr;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
