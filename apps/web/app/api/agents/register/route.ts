/**
 * External Agent API - Registration Endpoint
 * POST /api/agents/register
 *
 * Allows advanced users to register custom AI agents that can play games
 * via API using EIP-712 signatures for authentication
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// EIP-712 Domain for agent registration
const DOMAIN = {
    name: 'The Pontiff Protocol',
    version: '1',
    chainId: 10143, // Monad Testnet
    verifyingContract: process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!
};

// EIP-712 Type for agent registration
const AGENT_REGISTRATION_TYPE = {
    AgentRegistration: [
        { name: 'agentName', type: 'string' },
        { name: 'sessionWallet', type: 'address' },
        { name: 'ownerAddress', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
    ]
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            agentName,
            sessionWallet,
            ownerAddress,
            signature,
            timestamp,
            nonce
        } = body;

        // Validation
        if (!agentName || agentName.length < 3 || agentName.length > 50) {
            return NextResponse.json(
                { error: 'Agent name must be 3-50 characters' },
                { status: 400 }
            );
        }

        if (!sessionWallet || !ethers.isAddress(sessionWallet)) {
            return NextResponse.json(
                { error: 'Invalid session wallet address' },
                { status: 400 }
            );
        }

        if (!ownerAddress || !ethers.isAddress(ownerAddress)) {
            return NextResponse.json(
                { error: 'Invalid owner address' },
                { status: 400 }
            );
        }

        if (!signature || !timestamp || !nonce) {
            return NextResponse.json(
                { error: 'Missing signature, timestamp, or nonce' },
                { status: 400 }
            );
        }

        // Verify timestamp is recent (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 300) {
            return NextResponse.json(
                { error: 'Signature expired. Please try again.' },
                { status: 401 }
            );
        }

        // Verify EIP-712 signature
        const message = {
            agentName,
            sessionWallet,
            ownerAddress,
            timestamp,
            nonce
        };

        const digest = ethers.TypedDataEncoder.hash(
            DOMAIN,
            AGENT_REGISTRATION_TYPE,
            message
        );

        const recoveredAddress = ethers.recoverAddress(digest, signature);

        if (recoveredAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Check if agent already registered
        const { data: existing } = await supabase
            .from('external_agents')
            .select('*')
            .eq('session_wallet', sessionWallet.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Agent already registered for this session' },
                { status: 409 }
            );
        }

        // Generate API key
        const apiKey = `pontiff_${ethers.hexlify(ethers.randomBytes(32)).slice(2)}`;

        // Register agent in database
        const { data: agent, error: dbError } = await supabase
            .from('external_agents')
            .insert({
                agent_name: agentName,
                session_wallet: sessionWallet.toLowerCase(),
                owner_address: ownerAddress.toLowerCase(),
                api_key_hash: ethers.keccak256(ethers.toUtf8Bytes(apiKey)),
                is_active: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to register agent' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            agent: {
                id: agent.id,
                name: agentName,
                sessionWallet,
                ownerAddress
            },
            apiKey, // Only returned once - user must save it
            message: 'Agent registered successfully. Save your API key securely.'
        });

    } catch (error: any) {
        console.error('[API] Agent registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to register agent' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agents/register
 * Get registration info and requirements
 */
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/agents/register',
        method: 'POST',
        authentication: 'EIP-712 Signature',
        requirements: {
            agentName: 'string (3-50 chars)',
            sessionWallet: 'address (valid session wallet)',
            ownerAddress: 'address (wallet that owns session)',
            signature: 'EIP-712 signature',
            timestamp: 'uint256 (current unix timestamp)',
            nonce: 'uint256 (unique nonce)'
        },
        domain: DOMAIN,
        types: AGENT_REGISTRATION_TYPE,
        example: {
            agentName: 'MyCustomAgent',
            sessionWallet: '0x...',
            ownerAddress: '0x...',
            signature: '0x...',
            timestamp: 1234567890,
            nonce: 1
        }
    });
}
