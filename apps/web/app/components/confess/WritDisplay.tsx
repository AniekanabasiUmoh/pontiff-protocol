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
        link.download = `writ-of-sin-${walletAddress.slice(0, 8)}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-8 shadow-[0_0_30px_rgba(139,0,0,0.3)]"
        >
            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-6 font-cinzel text-[#8B0000]">
                YOUR WRIT OF SIN
            </h2>

            {/* Image Container with Zoom/Pan */}
            <div className="mb-6 bg-[#0a0a0a] rounded-lg overflow-hidden border-2 border-[#8B0000]/30">
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={3}
                    centerOnInit
                >
                    <TransformComponent
                        wrapperClass="!w-full !h-[600px]"
                        contentClass="!w-full !h-full flex items-center justify-center"
                    >
                        <img
                            src={imageUrl}
                            alt="Writ of Sin"
                            className="max-w-full max-h-full object-contain"
                        />
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* Zoom Instructions */}
            <p className="text-center text-[#e0e0e0]/50 text-sm mb-6 font-inter">
                Scroll to zoom • Drag to pan
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* Share on X */}
                <ShareButton imageUrl={imageUrl} walletAddress={walletAddress} />

                {/* Download Button */}
                <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border-2 border-[#8B0000] text-[#8B0000] font-bold rounded-lg transition-all font-cinzel"
                >
                    DOWNLOAD WRIT
                </motion.button>

                {/* Confess Another */}
                <motion.button
                    onClick={onReset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-transparent hover:bg-[#8B0000]/10 border-2 border-[#8B0000]/50 text-[#e0e0e0] font-bold rounded-lg transition-all font-inter"
                >
                    Confess Another Wallet
                </motion.button>
            </div>

            {/* Wallet Address Display */}
            <div className="mt-6 p-4 bg-[#0a0a0a] rounded border border-[#8B0000]/30">
                <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Judged Wallet:</p>
                <p className="text-[#8B0000] font-mono text-sm break-all">{walletAddress}</p>
            </div>
        </motion.div>
    )
}
