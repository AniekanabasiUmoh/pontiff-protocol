'use client'

import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'

interface Sin {
    type: string
    severity: 'venial' | 'mortal' | 'cardinal'
    description: string
}

interface ManuscriptProps {
    roast: string
    sins: Sin[]
    walletAddress: string
    onReset: () => void
    onPayPenance: () => void
    onShare: () => void
    penanceAmount: string
    penancePaid: boolean
    onToast?: (message: string, type: 'success' | 'error') => void
}

export function IlluminatedManuscript({
    roast,
    sins,
    walletAddress,
    onReset,
    onPayPenance,
    onShare,
    penanceAmount,
    penancePaid,
    onToast
}: ManuscriptProps) {

    const formattedAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : 'UNKNOWN_SOUL'

    const sinCount = sins.length || 0

    // Clean roast text (remove quotes if API added them)
    const cleanRoast = (roast || "The Pontiff is silent.").replace(/^["']|["']$/g, '');

    const containerRef = useRef<HTMLDivElement>(null)

    const handleDownload = async () => {
        if (!containerRef.current) return
        try {
            console.log("Starting capture...")

            // Create a filter to exclude buttons from the capture
            // AND ensure the QR code is visible while the text is hidden
            const filter = (node: HTMLElement) => {
                // Exclude buttons
                if (node.tagName === 'BUTTON') return false

                // Logic for swapping Text <-> QR
                // If it's the "penance-text" class, hide it
                if (node.classList && node.classList.contains('penance-text')) return false

                return true
            }

            // Temporarily show QR code
            const qrCode = document.getElementById('manuscript-qr')
            if (qrCode) qrCode.style.display = 'flex' // Changed to flex for centering

            const dataUrl = await toPng(containerRef.current, {
                cacheBust: false,
                backgroundColor: '#0f0d05',
                filter: filter,
                pixelRatio: 2,
                skipFonts: true // Bypass CORS issues with stylesheets
            })

            const link = document.createElement('a')
            link.download = `pontiff-decree-${Date.now()}.png`
            link.href = dataUrl
            link.click()

            // Hide QR code again
            if (qrCode) qrCode.style.display = 'none'

            console.log("Capture complete")
            return true
        } catch (err: any) {
            // Hide QR code again if error
            const qrCode = document.getElementById('manuscript-qr')
            if (qrCode) qrCode.style.display = 'none'

            console.error('Download failed', err)
            // If it's a security error, specific alert
            if (err.name === 'SecurityError') {
                onToast?.('Capture failed: Blocked by browser security.', 'error')
            } else {
                onToast?.(`Capture failed: ${err.message || 'Unknown error'}`, 'error')
            }
            return false
        }
    }

    const handleShare = async () => {
        // 1. Try to download first
        await handleDownload()

        // 2. Open Twitter Intent
        const text = `I seek absolution for my ${sinCount} crypto sins. My penance is ${penanceAmount} GUILT. Judge me at pontiff.gg #ThePontiff`
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    console.log("Rendering Illuminated Manuscript", { roast, cleanRoast, sinCount });

    return (
        <div className="w-full relative z-10 flex flex-col font-sans text-white overflow-hidden min-h-[600px] lg:min-h-[700px]">
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        
        .gold-text-glow {
            text-shadow: 0 0 10px rgba(244, 192, 37, 0.5), 0 0 20px rgba(244, 192, 37, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #221e10; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f4c025; 
            border-radius: 2px;
        }
      `}</style>

            {/* Main Container: Flex-1 to fill EXACTLY the remaining space */}
            <main ref={containerRef} className="relative z-10 w-full flex-1 min-h-0 mx-auto max-w-[1600px] grid grid-cols-1 lg:grid-cols-2 bg-[#0f0d05] border-2 border-[#f4c025]/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden">

                {/* Left Panel: The Icon (Hidden on mobile, or 50% width on desktop) */}
                <section className="relative hidden lg:block h-full border-r-4 border-[#f4c025]/30 group overflow-hidden">
                    {/* Image Container */}
                    <div className="absolute inset-0 z-0 bg-[#0f0d05]">
                        <img
                            alt="Patron Saint of Bad Odds"
                            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-80 transition-opacity duration-700 grayscale hover:grayscale-0"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGSK7zfxpiDTgNGVZJO-fzRXQXIEVFmMT1NkVlsNDDj-_ziLk2ibDRA8OOIalNQdWN6maowg4dQhbGox2_rCFUr4Y9CnLRd8aSdoOWj2gMA5_vVGTTeNeLa_AbBnqFTBDRAOiEpNHMvz9ccRz4khbkK17aB0rbBZEphVr0RsJbSHytzwk92DP_4JuTGkOSOFyC6FNEJmiOZCl1JQlvMvrmXIMCe17jvxMY5XrJALeoBKIH21SdY-FJTJ1mHh6ITqLhu1NSttrE2pdB"
                            crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a160a] via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-[#f4c025]/10 mix-blend-overlay"></div>
                    </div>

                    {/* Halo UI Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square border border-[#f4c025]/20 rounded-full flex items-center justify-center animate-pulse duration-[4000ms]">
                        <div className="w-[90%] h-[90%] border border-[#f4c025]/10 rounded-full rotate-45"></div>
                        <div className="w-[95%] h-[95%] border border-dotted border-[#f4c025]/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    </div>

                    {/* Overlay Text - Positioned higher to ensure visibility */}
                    <div className="absolute bottom-12 left-12 right-12 z-20">
                        <h2 className="text-5xl font-bold text-white mb-2 tracking-tight font-display">THE PONTIFF</h2>
                        <div className="h-0.5 w-24 bg-[#f4c025] mb-4 shadow-[0_0_10px_#f4c025]"></div>
                        <p className="text-gray-400 text-sm max-w-md font-display leading-relaxed">
                            The silent observer of your digital transgressions. Calculates penance in real-time with zero latency.
                        </p>
                    </div>
                </section>

                {/* Right Panel: The Scriptorium / Writ of Sin */}
                <section className="relative bg-[#221e10] flex flex-col h-full font-display">
                    {/* Header Frame - Fixed Height */}
                    <header className="h-16 shrink-0 border-b border-[#f4c025]/20 bg-[#161309] flex items-center justify-between px-6 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#f4c025] to-transparent opacity-50"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-[#f4c025] flex items-center justify-center bg-[#f4c025]/10">
                                {/* SVG Gavel to avoid font rendering issues */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#f4c025]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.26 16.71L10.07 8.9l-2.07-2.07c.83-1.66 2.5-2.83 4.5-2.83 1.08 0 2.05.34 2.85.92l5.44-5.44 1.42 1.42-5.43 5.43c.58.79.92 1.77.92 2.85 0 2-1.17 3.67-2.83 4.5l-2.07-2.07-7.81 7.81-2.73-2.71zM11.5 9.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-[#f4c025] text-sm font-bold tracking-[0.15em] uppercase">Writ of Absolution</h1>
                                {/* ID Removed */}
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area: The Roast - Flex Grow with overflow handling */}
                    <div className="flex-1 p-8 lg:p-12 relative overflow-hidden flex flex-col min-h-0">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-20 pointer-events-none"></div>

                        {/* Decorative Initial Cap */}
                        <div className="absolute top-8 left-6 text-9xl font-bold text-[#f4c025]/5 font-serif pointer-events-none select-none">T</div>

                        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-4 flex flex-col">
                            <div className="text-center mb-6 shrink-0">
                                <span className="inline-block py-0.5 px-3 border border-[#f4c025]/30 rounded-full text-[#f4c025]/80 text-[10px] tracking-widest uppercase mb-2 bg-[#f4c025]/5">Official Decree</span>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 gold-text-glow">YOUR TRANSGRESSIONS</h2>
                                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#f4c025]/50 to-transparent my-4"></div>
                            </div>

                            <div className="space-y-4 text-base lg:text-lg leading-relaxed text-gray-300 font-light grow">
                                <p>
                                    <span className="text-[#f4c025] font-bold text-2xl float-left mr-2 mt-[-4px]">{cleanRoast ? cleanRoast.charAt(0) : ''}</span>
                                    {cleanRoast ? cleanRoast.slice(1) : ''}
                                </p>

                                {/* Stats Removed as requested */}

                                {/* Evidence List - Compact */}
                                {sins && sins.length > 0 && (
                                    <div className="border border-[#f4c025]/10 rounded p-3 bg-[#1a160a]/50 shrink-0">
                                        <h3 className="text-[10px] text-[#f4c025] uppercase tracking-widest mb-2">Evidence ({sinCount})</h3>
                                        <ul className="space-y-1">
                                            {sins.slice(0, 3).map((sin, idx) => (
                                                <li key={idx} className="text-[11px] font-mono text-gray-400 flex gap-2 truncate" title={sin.description}>
                                                    <span className={`${sin.severity === 'cardinal' ? 'text-red-600' : sin.severity === 'mortal' ? 'text-red-400' : 'text-yellow-500'}`}>†</span>
                                                    {sin.type}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer - Compounded and Fixed Height */}
                    <footer className="h-auto shrink-0 bg-[#110e05] border-t-4 border-[#f4c025]/20 p-6 relative z-20">
                        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                            <div className="text-center xl:text-left relative">
                                {/* Normal View: Penance Text */}
                                <div className="penance-text">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Penance Required</div>
                                    <div className="text-2xl font-bold text-white flex items-center justify-center xl:justify-start gap-2">
                                        {penanceAmount} GUILT
                                        <span className="text-[10px] font-normal text-[#f4c025] bg-[#f4c025]/10 px-1.5 py-0.5 rounded border border-[#f4c025]/30">PAYABLE NOW</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full xl:w-auto xl:min-w-[320px]">
                                {/* Secondary Actions Row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={onReset}
                                        className="px-2 py-3 bg-transparent border border-gray-700 text-gray-400 text-[10px] uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors rounded text-center whitespace-nowrap flex items-center justify-center"
                                    >
                                        Back
                                    </button>

                                    <button
                                        onClick={handleDownload}
                                        className="px-2 py-3 bg-transparent border border-[#f4c025]/30 text-[#f4c025] text-[10px] uppercase tracking-wider hover:bg-[#f4c025]/10 transition-colors rounded flex items-center justify-center gap-1 whitespace-nowrap"
                                    >
                                        <span className="material-icons text-xs">download</span>
                                        Save
                                    </button>

                                    <button
                                        onClick={handleShare}
                                        className="px-2 py-3 bg-transparent border border-[#f4c025]/30 text-[#f4c025] text-[10px] uppercase tracking-wider hover:bg-[#f4c025]/10 transition-colors rounded flex items-center justify-center gap-1 whitespace-nowrap"
                                    >
                                        <span className="material-icons text-xs">share</span>
                                        Share
                                    </button>
                                </div>

                                {/* Primary Action */}
                                <button
                                    onClick={penancePaid ? handleShare : onPayPenance}
                                    className="w-full group relative flex items-center justify-center gap-2 bg-[#f4c025] hover:bg-[#dcb022] text-[#1a160a] font-bold py-3 px-6 rounded transition-all duration-300 shadow-[0_0_20px_rgba(244,192,37,0.3)] whitespace-nowrap"
                                >
                                    <span className="material-icons">{penancePaid ? 'share' : 'fingerprint'}</span>
                                    <span className="tracking-widest uppercase text-sm sm:text-base">
                                        {penancePaid ? 'SHARE ON X' : 'SEEK ABSOLUTION'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Capture View: QR Code (Hidden by default, fills footer on capture) */}
                        <div id="manuscript-qr" className="hidden absolute inset-0 bg-[#110e05] z-50 flex flex-col items-center justify-center p-4 gap-2">
                            {/* Text on Top */}
                            <div className="text-center">
                                <div className="text-[#f4c025] font-bold text-lg tracking-[0.1em] uppercase mb-1 drop-shadow-md">Confess Your Sins</div>
                                <div className="text-gray-400 text-[10px] tracking-wider font-mono">pontiff.gg</div>
                            </div>

                            {/* QR Code Below */}
                            <div className="bg-white p-1 rounded-sm border-2 border-[#f4c025] h-auto w-auto max-h-[80%] flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://pontiff.gg"
                                    alt="Pontiff QR"
                                    className="h-24 w-24 object-contain"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        </div>
                    </footer>
                </section>
            </main>

            {/* Overlay Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-40 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
        </div>
    )
}
