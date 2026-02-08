import { render, screen } from '@testing-library/react'
import { ScanningAnimation } from '../ScanningAnimation'

describe('ScanningAnimation', () => {
    it('renders scanning title', () => {
        render(<ScanningAnimation />)
        expect(screen.getByText('SCANNING SOUL...')).toBeInTheDocument()
    })

    it('displays initial scanning stage', () => {
        render(<ScanningAnimation />)
        expect(screen.getByText('Connecting to the Divine...')).toBeInTheDocument()
    })

    it('shows progress percentage', () => {
        render(<ScanningAnimation />)
        expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('displays atmospheric quote', () => {
        render(<ScanningAnimation />)
        expect(screen.getByText('"The truth shall be revealed..."')).toBeInTheDocument()
    })

    it('renders papal seal icon', () => {
        const { container } = render(<ScanningAnimation />)
        expect(container.textContent).toContain('⛪')
    })
})
