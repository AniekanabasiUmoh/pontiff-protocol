import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { useAccount, useSignMessage } from 'wagmi'

// Mock wagmi hooks
jest.mock('wagmi', () => ({
    useAccount: jest.fn(),
    useSignMessage: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('useAuth Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    it('initializes with unauthenticated state', () => {
        (useAccount as jest.Mock).mockReturnValue({
            address: undefined,
            isConnected: false,
        })
            (useSignMessage as jest.Mock).mockReturnValue({
                signMessageAsync: jest.fn(),
            })

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isLoading).toBe(true)
    })

    it('checks authentication status when address changes', async () => {
        const mockAddress = '0x1234567890123456789012345678901234567890'
            ; (useAccount as jest.Mock).mockReturnValue({
                address: mockAddress,
                isConnected: true,
            })
            ; (useSignMessage as jest.Mock).mockReturnValue({
                signMessageAsync: jest.fn(),
            })
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => ({ authenticated: true, address: mockAddress }),
            })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.address).toBe(mockAddress)
    })

    it('successfully signs in with valid signature', async () => {
        const mockAddress = '0x1234567890123456789012345678901234567890'
        const mockNonce = 'test-nonce-123'
        const mockSignature = '0xsignature'

            ; (useAccount as jest.Mock).mockReturnValue({
                address: mockAddress,
                isConnected: true,
            })

        const mockSignMessageAsync = jest.fn().mockResolvedValue(mockSignature)
            ; (useSignMessage as jest.Mock).mockReturnValue({
                signMessageAsync: mockSignMessageAsync,
            })

            // Mock nonce fetch
            ; (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    json: async () => ({ nonce: mockNonce }),
                })
                // Mock verify fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, address: mockAddress }),
                })

        const { result } = renderHook(() => useAuth())

        await act(async () => {
            await result.current.signIn()
        })

        expect(mockSignMessageAsync).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/nonce')
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/auth/verify',
            expect.objectContaining({
                method: 'POST',
            })
        )
        expect(result.current.isAuthenticated).toBe(true)
    })

    it('handles sign in error gracefully', async () => {
        const mockAddress = '0x1234567890123456789012345678901234567890'

            ; (useAccount as jest.Mock).mockReturnValue({
                address: mockAddress,
                isConnected: true,
            })

            ; (useSignMessage as jest.Mock).mockReturnValue({
                signMessageAsync: jest.fn().mockRejectedValue(new Error('User rejected')),
            })

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => ({ nonce: 'test-nonce' }),
            })

        const { result } = renderHook(() => useAuth())

        await expect(result.current.signIn()).rejects.toThrow()
        expect(result.current.isAuthenticated).toBe(false)
    })

    it('signs out successfully', async () => {
        const mockAddress = '0x1234567890123456789012345678901234567890'

            ; (useAccount as jest.Mock).mockReturnValue({
                address: mockAddress,
                isConnected: true,
            })
            ; (useSignMessage as jest.Mock).mockReturnValue({
                signMessageAsync: jest.fn(),
            })

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => ({}),
            })

        const { result } = renderHook(() => useAuth())

        // Set authenticated state
        act(() => {
            result.current.signOut()
        })

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false)
        })

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
            method: 'POST',
        })
    })
})
