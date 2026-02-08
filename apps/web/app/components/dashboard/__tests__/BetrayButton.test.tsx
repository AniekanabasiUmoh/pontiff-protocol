import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BetrayButton } from '../BetrayButton'

describe('BetrayButton', () => {
    const mockOnBetray = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders betray button', () => {
        render(<BetrayButton userHasBetrayed={false} onBetray={mockOnBetray} />)

        expect(screen.getByText('BETRAY FAITH')).toBeInTheDocument()
    })

    it('shows confirmation modal when clicked', () => {
        render(<BetrayButton userHasBetrayed={false} onBetray={mockOnBetray} />)

        const button = screen.getByText('BETRAY FAITH')
        fireEvent.click(button)

        expect(screen.getByText('BETRAY YOUR FAITH?')).toBeInTheDocument()
        expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
    })

    it('calls onBetray when confirmed', async () => {
        render(<BetrayButton userHasBetrayed={false} onBetray={mockOnBetray} />)

        // Open modal
        const button = screen.getByText('BETRAY FAITH')
        fireEvent.click(button)

        // Confirm
        const confirmButton = screen.getAllByText('BETRAY FAITH')[1] // Second one is in modal
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockOnBetray).toHaveBeenCalled()
        })
    })

    it('closes modal when cancel clicked', () => {
        render(<BetrayButton userHasBetrayed={false} onBetray={mockOnBetray} />)

        // Open modal
        const button = screen.getByText('BETRAY FAITH')
        fireEvent.click(button)

        // Cancel
        const cancelButton = screen.getByText('CANCEL')
        fireEvent.click(cancelButton)

        expect(screen.queryByText('BETRAY YOUR FAITH?')).not.toBeInTheDocument()
    })

    it('shows betrayed state when user has betrayed', () => {
        render(<BetrayButton userHasBetrayed={true} onBetray={mockOnBetray} />)

        expect(screen.getByText('✓ FAITH BETRAYED')).toBeInTheDocument()
    })

    it('disables button when user has betrayed', () => {
        render(<BetrayButton userHasBetrayed={true} onBetray={mockOnBetray} />)

        const button = screen.getByText('✓ FAITH BETRAYED')
        expect(button).toBeDisabled()
    })
})
