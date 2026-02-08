import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { verifyAndConsumeNonce, createSession } from '../../../lib/auth-db'

export async function POST(request: NextRequest) {
    try {
        const { message, signature } = await request.json()

        const siweMessage = new SiweMessage(message)
        const fields = await siweMessage.verify({ signature })

        if (!fields.success) {
            console.error('SIWE verification failed:', fields.error)
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        // Verify nonce hasn't been used (replay attack prevention)
        const nonceValid = await verifyAndConsumeNonce(
            fields.data.nonce,
            fields.data.address.toLowerCase()
        )

        if (!nonceValid) {
            console.error('Nonce validation failed for address:', fields.data.address)
            return NextResponse.json(
                { error: 'Invalid or expired nonce' },
                { status: 401 }
            )
        }

        // Create session in database
        const session = await createSession(
            fields.data.address.toLowerCase(),
            fields.data.chainId,
            fields.data.nonce,
            signature
        )

        if (!session) {
            console.error('Session creation failed for address:', fields.data.address)
            return NextResponse.json(
                { error: 'Failed to create session' },
                { status: 500 }
            )
        }

        // Set session cookie with session ID
        const response = NextResponse.json({
            success: true,
            address: fields.data.address,
        })

        response.cookies.set('siwe-session-id', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
        })

        return response
    } catch (error) {
        console.error('Verification error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        )
    }
}
