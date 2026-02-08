import { NextRequest, NextResponse } from 'next/server'
import { createNonce } from '../../../lib/auth-db'

export async function GET(request: NextRequest) {
    try {
        // Get wallet address from query params
        const { searchParams } = new URL(request.url)
        const address = searchParams.get('address')

        if (!address) {
            return NextResponse.json(
                { error: 'Wallet address required' },
                { status: 400 }
            )
        }

        // Generate and store nonce in database
        const nonce = await createNonce(address.toLowerCase())

        return NextResponse.json({ nonce })
    } catch (error) {
        console.error('Nonce generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate nonce' },
            { status: 500 }
        )
    }
}
