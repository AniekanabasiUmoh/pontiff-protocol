/**
 * Authentication Middleware
 * Validates SIWE sessions for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                address: string;
                sessionToken: string;
            };
        }
    }
}

/**
 * Require authentication middleware
 * Validates session token and attaches user info to request
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
            });
        }

        const sessionToken = authHeader.replace('Bearer ', '');

        // Validate session in database
        const { data: session, error } = await supabase
            .from('auth_sessions')
            .select('wallet_address, expires_at')
            .eq('session_token', sessionToken)
            .single();

        if (error || !session) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid session token',
            });
        }

        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            // Delete expired session
            await supabase
                .from('auth_sessions')
                .delete()
                .eq('session_token', sessionToken);

            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Session expired',
            });
        }

        // Update last activity
        await supabase
            .from('auth_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('session_token', sessionToken);

        // Attach user info to request
        req.user = {
            address: session.wallet_address,
            sessionToken,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication check failed',
        });
    }
}

/**
 * Optional authentication middleware
 * Attaches user info if valid session exists, but doesn't reject
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const sessionToken = authHeader.replace('Bearer ', '');

        const { data: session, error } = await supabase
            .from('auth_sessions')
            .select('wallet_address, expires_at')
            .eq('session_token', sessionToken)
            .single();

        if (!error && session && new Date(session.expires_at) >= new Date()) {
            req.user = {
                address: session.wallet_address,
                sessionToken,
            };

            // Update last activity
            await supabase
                .from('auth_sessions')
                .update({ last_activity: new Date().toISOString() })
                .eq('session_token', sessionToken);
        }

        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
}

/**
 * Verify wallet ownership middleware
 * Ensures the authenticated user owns the wallet they're acting on
 */
export function verifyWalletOwnership(req: Request, res: Response, next: NextFunction) {
    const { walletAddress } = req.body;
    const paramAddress = req.params.address;
    const targetAddress = (walletAddress || paramAddress)?.toLowerCase();

    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    if (!targetAddress) {
        return res.status(400).json({
            error: 'Bad request',
            message: 'Wallet address not specified',
        });
    }

    if (req.user.address.toLowerCase() !== targetAddress) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'You can only perform this action on your own wallet',
        });
    }

    next();
}
