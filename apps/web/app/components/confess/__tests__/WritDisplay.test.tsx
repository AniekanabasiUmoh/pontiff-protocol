import { render, screen, fireEvent } from '@testing-library/react'
import { WritDisplay } from '../WritDisplay'

describe('WritDisplay', () => {
    const mockOnReset = jest.fn()
    const mockImageUrl = 'https://example.com/writ.png'
    const mockWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders writ image', () => {
        render(
            <WritDisplay
                imageUrl={mockImageUrl}
                walletAddress={mockWalletAddress}
                onReset={mockOnReset}
            />
        )

        const image = screen.getByAltText('Writ of Sin')
        expect(image).toHaveAttribute('src', mockImageUrl)
    })

    it('displays wallet address', () => {
        render(
            <WritDisplay
                imageUrl={mockImageUrl}
                walletAddress={mockWalletAddress}
                onReset={mockOnReset}
            />
        )

        expect(screen.getByText(mockWalletAddress)).toBeInTheDocument()
    })

    it('shows action buttons', () => {
        render(
            <WritDisplay
                imageUrl={mockImageUrl}
                walletAddress={mockWalletAddress}
                onReset={mockOnReset}
            />
        )

        expect(screen.getByText('SHARE ON X')).toBeInTheDocument()
        expect(screen.getByText('DOWNLOAD WRIT')).toBeInTheDocument()
        expect(screen.getByText('Confess Another Wallet')).toBeInTheDocument()
    })

    it('calls onReset when confess another button is clicked', () => {
        render(
            <WritDisplay
                imageUrl={mockImageUrl}
                walletAddress={mockWalletAddress}
                onReset={mockOnReset}
            />
        )

        const button = screen.getByText('Confess Another Wallet')
        fireEvent.click(button)

        expect(mockOnReset).toHaveBeenCalled()
    })

    it('displays zoom instructions', () => {
        render(
            <WritDisplay
                imageUrl={mockImageUrl}
                walletAddress={mockWalletAddress}
                onReset={mockOnReset}
            />
        )

        expect(screen.getByText('Scroll to zoom • Drag to pan')).toBeInTheDocument()
    })
})
