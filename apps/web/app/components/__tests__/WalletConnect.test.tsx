import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletConnect } from '../components/WalletConnect'
import { useAccount } from 'wagmi'
import { useAuth } from '../hooks/useAuth'

// Mock wagmi and useAuth
jest.mock('wagmi', () => ({
    useAccount: jest.fn(),
}))

jest.mock('../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}))

jest.mock('@rainbow-me/rainbowkit', () => ({
    ConnectButton: () => <button>Connect Wallet</button>,
}))

describe('WalletConnect Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders connect button when wallet not connected', () => {
        (useAccount as jest.Mock).mockReturnValue({
            address: undefined,
            isConnected: false,
        })
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
            })

        render(<WalletConnect />)
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('shows sign in button when wallet connected but not authenticated', () => {
        (useAccount as jest.Mock).mockReturnValue({
            address: '0x1234567890123456789012345678901234567890',
            isConnected: true,
        })
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
            })

        render(<WalletConnect />)
        expect(screen.getByText('Sign In to Confess')).toBeInTheDocument()
    })

    it('shows authenticated state when signed in', () => {
        const mockAddress = '0x1234567890123456789012345678901234567890'
            (useAccount as jest.Mock).mockReturnValue({
                address: mockAddress,
                isConnected: true,
            })
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                address: mockAddress,
                signIn: jest.fn(),
                signOut: jest.fn(),
            })

        render(<WalletConnect />)
        expect(screen.getByText('✓ Authenticated')).toBeInTheDocument()
        expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument()
    })

    it('calls signIn when sign in button clicked', async () => {
        const mockSignIn = jest.fn()
            (useAccount as jest.Mock).mockReturnValue({
                address: '0x1234567890123456789012345678901234567890',
                isConnected: true,
            })
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                signIn: mockSignIn,
                signOut: jest.fn(),
            })

        render(<WalletConnect />)
        const signInButton = screen.getByText('Sign In to Confess')
        await userEvent.click(signInButton)

        expect(mockSignIn).toHaveBeenCalledTimes(1)
    })

    it('calls signOut when sign out button clicked', async () => {
        const mockSignOut = jest.fn()
            (useAccount as jest.Mock).mockReturnValue({
                address: '0x1234567890123456789012345678901234567890',
                isConnected: true,
            })
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                signIn: jest.fn(),
                signOut: mockSignOut,
            })

        render(<WalletConnect />)
        const signOutButton = screen.getByText('Sign Out')
        await userEvent.click(signOutButton)

        expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
})
