import { render, screen } from '@testing-library/react'
import { DoomsdayClock } from '../DoomsdayClock'

describe('DoomsdayClock', () => {
    it('renders countdown timer', () => {
        const futureTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
        render(<DoomsdayClock epochEndTime={futureTime} />)

        expect(screen.getByText('DOOMSDAY CLOCK')).toBeInTheDocument()
        expect(screen.getByText('Until Judgment')).toBeInTheDocument()
    })

    it('displays time in HH:MM:SS format', () => {
        const futureTime = Date.now() + 2 * 60 * 60 * 1000 // 2 hours from now
        const { container } = render(<DoomsdayClock epochEndTime={futureTime} />)

        // Should have time display with colons
        expect(container.textContent).toMatch(/\d{2}:\d{2}:\d{2}/)
    })

    it('shows panic mode when less than 10 minutes remaining', () => {
        const futureTime = Date.now() + 5 * 60 * 1000 // 5 minutes from now
        render(<DoomsdayClock epochEndTime={futureTime} />)

        expect(screen.getByText(/PANIC MODE/i)).toBeInTheDocument()
        expect(screen.getByText(/FINAL MINUTES TO BETRAY!/i)).toBeInTheDocument()
    })

    it('displays atmospheric quote when not in panic mode', () => {
        const futureTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
        render(<DoomsdayClock epochEndTime={futureTime} />)

        expect(screen.getByText(/"Time runs short for the faithful..."/i)).toBeInTheDocument()
    })

    it('shows epoch ended when time is up', () => {
        const pastTime = Date.now() - 1000 // 1 second ago
        render(<DoomsdayClock epochEndTime={pastTime} />)

        expect(screen.getByText('EPOCH ENDED')).toBeInTheDocument()
    })
})
