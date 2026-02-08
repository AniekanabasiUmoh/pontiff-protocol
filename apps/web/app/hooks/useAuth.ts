'use client'

import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useState, useEffect } from 'react'

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    address?: string
}

export function useAuth() {
    const { address, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
    })

    // Check authentication status on mount
    useEffect(() => {
        checkAuth()
    }, [address])

    async function checkAuth() {
        if (!address) {
            setAuthState({ isAuthenticated: false, isLoading: false })
            return
        }

        try {
            const res = await fetch('/api/auth/me')
            const data = await res.json()

            setAuthState({
                isAuthenticated: data.authenticated && data.address === address,
                isLoading: false,
                address: data.address,
            })
        } catch (error) {
            setAuthState({ isAuthenticated: false, isLoading: false })
        }
    }

    async function signIn() {
        if (!address || !isConnected) {
            throw new Error('Wallet not connected')
        }

        try {
            // 1. Get nonce from backend
            const nonceRes = await fetch(`/api/auth/nonce?address=${address}`)
            const { nonce } = await nonceRes.json()

            // 2. Create SIWE message
            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in to The Pontiff',
                uri: window.location.origin,
                version: '1',
                chainId: 10143, // Monad Testnet
                nonce,
            })

            // 3. Sign message
            const signature = await signMessageAsync({
                message: message.prepareMessage(),
            })

            // 4. Verify signature on backend
            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, signature }),
            })

            if (!verifyRes.ok) {
                throw new Error('Verification failed')
            }

            // 5. Update auth state
            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                address,
            })

            return true
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    async function signOut() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            setAuthState({ isAuthenticated: false, isLoading: false })
        } catch (error) {
            console.error('Sign out error:', error)
        }
    }

    return {
        ...authState,
        signIn,
        signOut,
        checkAuth,
    }
}
