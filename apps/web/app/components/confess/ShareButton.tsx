'use client'

import { motion } from 'framer-motion'

interface ShareButtonProps {
    imageUrl: string
    walletAddress: string
}

export function ShareButton({ imageUrl, walletAddress }: ShareButtonProps) {
    const handleShare = () => {
        const tweetText = `🔥 The Pontiff has judged my sins! 🔥

Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}

Confess your crypto sins at ${process.env.NEXT_PUBLIC_APP_URL || 'https://thepontiff.xyz'}/confess

#ThePontiff #MonadHackathon #CryptoSins`

        // Twitter intent URL
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(imageUrl)}`

        // Open in new window
        window.open(twitterUrl, '_blank', 'width=550,height=420')
    }

    return (
        <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(29,161,242,0.3)] hover:shadow-[0_0_30px_rgba(29,161,242,0.5)] transition-all font-cinzel text-lg flex items-center justify-center gap-2"
        >
            <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            SHARE ON X
        </motion.button>
    )
}
