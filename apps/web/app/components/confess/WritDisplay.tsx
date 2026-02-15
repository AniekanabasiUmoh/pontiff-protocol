'use client'

import { motion } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ShareButton } from './ShareButton'

interface WritDisplayProps {
    imageUrl: string
    walletAddress: string
    onReset: () => void
}

export function WritDisplay({ imageUrl, walletAddress, onReset }: WritDisplayProps) {
    const handleDownload = () => {
        const link = document.createElement('a')
        link.href = imageUrl
        // If it's a PNG from Imagen, download as PNG. If SVG, it's SVG.
        // We'll just generic extension based on content if we could, but .png covers likely Imagen case.
        // The browser handles data URI download correctly mostly.
        link.download = `writ-of-sin.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-obsidian border border-primary/30 rounded-lg p-6 lg:p-8 shadow-[0_0_50px_rgba(242,185,13,0.1)] relative"
        >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50" />

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-6 font-display text-primary tracking-[0.2em] uppercase text-gold-glow">
                Writ of Sin
            </h2>

            {/* Image Container with Zoom/Pan */}
            <div className="mb-6 bg-background-dark rounded border border-primary/20 overflow-hidden relative">
                {/* Scanline effect overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />

                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={3}
                    centerOnInit
                >
                    <TransformComponent
                        wrapperClass="!w-full !h-[500px] lg:!h-[600px]"
                        contentClass="!w-full !h-full flex items-center justify-center"
                    >
                        <img
                            src={imageUrl}
                            alt="Writ of Sin"
                            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_15px_rgba(242,185,13,0.2)]"
                        />
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* Zoom Instructions */}
            <p className="text-center text-primary/40 text-[10px] uppercase tracking-widest mb-6 font-mono">
                [ Scroll to zoom • Drag to pan ]
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* Share on X - kept separate for logical grouping */}
                <ShareButton imageUrl={imageUrl} walletAddress={walletAddress} />

                {/* Download Button */}
                <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-primary/10 hover:bg-primary/20 border border-primary/50 text-primary font-bold rounded transition-all font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-2 group"
                >
                    <span className="material-icons text-lg group-hover:animate-bounce">download</span>
                    Download Writ
                </motion.button>

                {/* Confess Again */}
                <motion.button
                    onClick={onReset}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-transparent hover:bg-primary/5 border border-primary/30 text-primary/80 font-bold rounded transition-all font-mono text-sm uppercase tracking-widest"
                >
                    Confess Again
                </motion.button>
            </div>

            {/* Wallet Address Display REMOVED as per user request */}
        </motion.div>
    )
}
