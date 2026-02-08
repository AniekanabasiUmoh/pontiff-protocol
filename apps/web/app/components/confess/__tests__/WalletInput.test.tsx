import { render, screen, fireEvent } from '@testing-library/react'
import { WalletInput } from '../WalletInput'

// Mock wagmi
jest.mock('wagmi', () => ({
    useAccount: jest.fn(() => ({
        address: undefined,
        isConnected: false,
    })),
}))

describe('WalletInput', () => {
    const mockOnChange = jest.fn()
    const mockOnSubmit = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders input field and submit button', () => {
        render(
            <WalletInput
                value=""
                onChange={mockOnChange}
                onSubmit={mockOnSubmit}
                isLoading={false}
            />
        )

        expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
        expect(screen.getByText('CONFESS YOUR SINS')).toBeInTheDocument()
    })

    it('validates Ethereum address format', () => {
        render(
            <WalletInput
                value="invalid"
                onChange={mockOnChange}
                onSubmit={mockOnSubmit}
                isLoading={false}
            />
        )

        const input = screen.getByPlaceholderText('0x...')
        fireEvent.change(input, { target: { value: 'invalid' } })

        expect(screen.getByText('Invalid Ethereum address')).toBeInTheDocument()
    })

    it('accepts valid Ethereum address', () => {
        const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

        render(
            <WalletInput
                value={validAddress}
                onChange={mockOnChange}
                onSubmit={mockOnSubmit}
                isLoading={false}
            />
        )

        expect(screen.queryByText('Invalid Ethereum address')).not.toBeInTheDocument()
    })

    it('calls onSubmit when form is submitted with valid address', () => {
        const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

        render(
            <WalletInput
                value={validAddress}
                onChange={mockOnChange}
                onSubmit={mockOnSubmit}
                isLoading={false}
            />
        )

        const button = screen.getByText('CONFESS YOUR SINS')
        fireEvent.click(button)

        expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('disables submit button when loading', () => {
        render(
            <WalletInput
                value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                onChange={mockOnChange}
                onSubmit={mockOnSubmit}
                isLoading={true}
            />
        )

        const button = screen.getByText('CONFESSING...')
        expect(button).toBeDisabled()
    })
})
