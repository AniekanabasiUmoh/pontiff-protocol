import { render, screen, fireEvent } from '@testing-library/react'
import { StakingPanel } from '../StakingPanel'

describe('StakingPanel', () => {
    const mockOnDeposit = jest.fn()
    const mockOnWithdraw = jest.fn()

    const defaultProps = {
        userBalance: BigInt(1000),
        stakedBalance: BigInt(500),
        currentAPY: 42,
        onDeposit: mockOnDeposit,
        onWithdraw: mockOnWithdraw,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders staking panel with balances', () => {
        render(<StakingPanel {...defaultProps} />)

        expect(screen.getByText('STAKING CATHEDRAL')).toBeInTheDocument()
        expect(screen.getByText(/Wallet Balance/i)).toBeInTheDocument()
        expect(screen.getByText(/Staked Balance/i)).toBeInTheDocument()
    })

    it('switches between deposit and withdraw tabs', () => {
        render(<StakingPanel {...defaultProps} />)

        const depositTab = screen.getByText('DEPOSIT')
        const withdrawTab = screen.getByText('WITHDRAW')

        expect(depositTab).toHaveClass('bg-[#8B0000]')

        fireEvent.click(withdrawTab)
        expect(withdrawTab).toHaveClass('bg-[#8B0000]')
    })

    it('displays projected yield for deposit', () => {
        render(<StakingPanel {...defaultProps} />)

        const input = screen.getByPlaceholderText('0.0')
        fireEvent.change(input, { target: { value: '100' } })

        expect(screen.getByText(/Projected Yearly Yield/i)).toBeInTheDocument()
    })

    it('calls onDeposit when deposit button clicked', async () => {
        render(<StakingPanel {...defaultProps} />)

        const input = screen.getByPlaceholderText('0.0')
        fireEvent.change(input, { target: { value: '100' } })

        const depositButton = screen.getByText('DEPOSIT GUILT')
        fireEvent.click(depositButton)

        expect(mockOnDeposit).toHaveBeenCalled()
    })

    it('displays current APY', () => {
        render(<StakingPanel {...defaultProps} />)

        expect(screen.getByText('42%')).toBeInTheDocument()
    })
})
