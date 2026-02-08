/**
 * Authentication Routes
 * Implements SIWE (Sign-In with Ethereum) for wallet-based authentication
 */

import { Router, Request, Response } from 'express';
import { SiweMessage } from 'siwe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

// Clean expired nonces every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [address, data] of nonceStore.entries()) {
        if (data.expiresAt < now) {
            nonceStore.delete(address);
        }
    }
}, 5 * 60 * 1000);

/**
 * GET /api/auth/nonce/:address
 * Generate a nonce for SIWE message signing
 */
router.get('/nonce/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;

        // Validate address format
        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            return res.status(400).json({
                error: 'Invalid wallet address format',
            });
        }

        // Generate cryptographically secure nonce
        const nonce = crypto.randomBytes(16).toString('base64');
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store nonce
        nonceStore.set(address.toLowerCase(), { nonce, expiresAt });

        return res.json({
            nonce,
            expiresAt,
        });
    } catch (error) {
        console.error('Nonce generation error:', error);
        return res.status(500).json({
            error: 'Failed to generate nonce',
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify SIWE signature and create session
 *
 * Body:
 * - message: SIWE message object
 * - signature: Signature from wallet
 */
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { message, signature } = req.body;

        if (!message || !signature) {
            return res.status(400).json({
                error: 'Missing message or signature',
            });
        }

        // Parse SIWE message
        const siweMessage = new SiweMessage(message);

        // Verify the message structure
        const address = siweMessage.address.toLowerCase();

        // Check if nonce exists and is valid
        const storedNonce = nonceStore.get(address);
        if (!storedNonce) {
            return res.status(401).json({
                error: 'Invalid or expired nonce',
            });
        }

        if (storedNonce.nonce !== siweMessage.nonce) {
            return res.status(401).json({
                error: 'Nonce mismatch',
            });
        }

        if (storedNonce.expiresAt < Date.now()) {
            nonceStore.delete(address);
            return res.status(401).json({
                error: 'Nonce expired',
            });
        }

        // Verify the signature
        try {
            const fields = await siweMessage.verify({ signature });

            if (!fields.success) {
                return res.status(401).json({
                    error: 'Signature verification failed',
                });
            }
        } catch (verifyError) {
            console.error('SIWE verification error:', verifyError);
            return res.status(401).json({
                error: 'Invalid signature',
            });
        }

        // Signature is valid - remove used nonce
        nonceStore.delete(address);

        // Create session token
        const sessionToken = crypto.randomBytes(32).toString('base64');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store session in database
        const { data: session, error: sessionError } = await supabase
            .from('auth_sessions')
            .insert({
                wallet_address: address,
                session_token: sessionToken,
                expires_at: expiresAt.toISOString(),
                last_activity: new Date().toISOString(),
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Session creation error:', sessionError);
            return res.status(500).json({
                error: 'Failed to create session',
            });
        }

        return res.json({
            success: true,
            sessionToken,
            expiresAt: expiresAt.toISOString(),
            address,
        });
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
        });
    }
});

/**
 * POST /api/auth/logout
 * Invalidate session
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return res.status(400).json({
                error: 'No session token provided',
            });
        }

        // Delete session from database
        await supabase
            .from('auth_sessions')
            .delete()
            .eq('session_token', sessionToken);

        return res.json({
            success: true,
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            error: 'Logout failed',
        });
    }
});

/**
 * GET /api/auth/session
 * Check if session is valid
 */
router.get('/session', async (req: Request, res: Response) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return res.status(401).json({
                error: 'No session token provided',
            });
        }

        // Check session in database
        const { data: session, error } = await supabase
            .from('auth_sessions')
            .select('*')
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !session) {
            return res.status(401).json({
                error: 'Invalid or expired session',
            });
        }

        // Update last activity
        await supabase
            .from('auth_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('session_token', sessionToken);

        return res.json({
            valid: true,
            address: session.wallet_address,
            expiresAt: session.expires_at,
        });
    } catch (error) {
        console.error('Session check error:', error);
        return res.status(500).json({
            error: 'Session check failed',
        });
    }
});

export default router;
