'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'

interface WalletInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    isLoading: boolean
}

export function WalletInput({ value, onChange, onSubmit, isLoading }: WalletInputProps) {
    const { address, isConnected } = useAccount()
    const [error, setError] = useState<string | null>(null)

    const validateAddress = (addr: string): boolean => {
        // Basic Ethereum address validation
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
        return ethAddressRegex.test(addr)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        if (newValue && !validateAddress(newValue)) {
            setError('Invalid Ethereum address')
        } else {
            setError(null)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!value) {
            setError('Please enter a wallet address')
            return
        }

        if (!validateAddress(value)) {
            setError('Invalid Ethereum address')
            return
        }

        setError(null)
        onSubmit()
    }

    const handleUseConnected = () => {
        if (address) {
            onChange(address)
            setError(null)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Field */}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder="0x..."
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#8B0000]/50 rounded-lg text-[#e0e0e0] placeholder-[#e0e0e0]/30 focus:outline-none focus:border-[#8B0000] focus:shadow-[0_0_20px_rgba(139,0,0,0.5)] transition-all font-mono disabled:opacity-50"
                />

                {/* Use Connected Wallet Button */}
                {isConnected && address && (
                    <button
                        type="button"
                        onClick={handleUseConnected}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#8B0000]/20 hover:bg-[#8B0000]/40 border border-[#8B0000] rounded text-xs text-[#8B0000] transition-all disabled:opacity-50"
                    >
                        Use Connected
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm"
                >
                    {error}
                </motion.p>
            )}

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={isLoading || !value || !!error}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[#8B0000] hover:bg-[#a00000] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(139,0,0,0.5)] hover:shadow-[0_0_30px_rgba(139,0,0,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-cinzel text-lg"
            >
                {isLoading ? 'CONFESSING...' : 'CONFESS YOUR SINS'}
            </motion.button>

            {/* Helper Text */}
            <p className="text-center text-[#e0e0e0]/50 text-sm font-inter">
                Enter any Ethereum wallet address to reveal their sins
            </p>
        </form>
    )
}
