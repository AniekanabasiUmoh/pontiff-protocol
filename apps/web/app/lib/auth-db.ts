import { createClient } from '@supabase/supabase-js'

function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    )
}

export interface AuthSession {
    id: string
    wallet_address: string
    chain_id: number
    nonce: string
    signature?: string
    created_at: string
    expires_at: string
    last_seen_at: string
}

export interface AuthNonce {
    id: string
    nonce: string
    wallet_address: string
    created_at: string
    used_at?: string
    expires_at: string
}

/**
 * Generate and store a new nonce for SIWE authentication
 */
export async function createNonce(walletAddress: string): Promise<string> {
    const nonce = generateNonce()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const { error } = await getDb()
        .from('auth_nonces')
        .insert({
            nonce,
            wallet_address: walletAddress,
            expires_at: expiresAt.toISOString(),
        })

    if (error) {
        console.error('Error creating nonce:', error)
        throw new Error('Failed to create nonce')
    }

    return nonce
}

/**
 * Verify and mark nonce as used
 */
export async function verifyAndConsumeNonce(nonce: string, walletAddress: string): Promise<boolean> {
    // Check if nonce exists and is not expired
    const { data: nonceData, error: fetchError } = await getDb()
        .from('auth_nonces')
        .select('*')
        .eq('nonce', nonce)
        .eq('wallet_address', walletAddress)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (fetchError || !nonceData) {
        return false
    }

    // Mark nonce as used
    const { error: updateError } = await getDb()
        .from('auth_nonces')
        .update({ used_at: new Date().toISOString() })
        .eq('nonce', nonce)

    if (updateError) {
        console.error('Error marking nonce as used:', updateError)
        return false
    }

    return true
}

/**
 * Create a new session
 */
export async function createSession(
    walletAddress: string,
    chainId: number,
    nonce: string,
    signature: string
): Promise<AuthSession | null> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { data, error } = await getDb()
        .from('auth_sessions')
        .upsert({
            wallet_address: walletAddress,
            chain_id: chainId,
            nonce,
            signature,
            expires_at: expiresAt.toISOString(),
            last_seen_at: new Date().toISOString(),
        }, {
            onConflict: 'wallet_address,chain_id'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating session:', error)
        return null
    }

    return data
}

export async function getSession(walletAddress: string, chainId: number): Promise<AuthSession | null> {
    const { data, error } = await getDb()
        .from('auth_sessions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) {
        return null
    }

    // Update last_seen_at
    await getDb()
        .from('auth_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', data.id)

    return data
}

/**
 * Get session by session token (for API testing with Bearer tokens)
 */
export async function getSessionByToken(sessionToken: string): Promise<AuthSession | null> {
    const { data, error } = await getDb()
        .from('auth_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) {
        return null
    }

    // Update last_activity
    await getDb()
        .from('auth_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', data.id)

    return data
}

/**
 * Delete session (logout)
 */
export async function deleteSession(walletAddress: string, chainId: number): Promise<void> {
    await getDb()
        .from('auth_sessions')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
}

/**
 * Generate a cryptographically secure nonce
 */
function generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
