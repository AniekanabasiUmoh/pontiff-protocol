import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/auth-db'

export async function POST(request: NextRequest) {
    const sessionId = request.cookies.get('siwe-session-id')?.value

    if (sessionId) {
        // Delete session from database
        await supabase
            .from('auth_sessions')
            .delete()
            .eq('id', sessionId)
    }

    const response = NextResponse.json({ success: true })

    // Clear session cookie
    response.cookies.delete('siwe-session-id')

    return response
}
