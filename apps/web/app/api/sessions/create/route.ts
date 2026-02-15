/**
 * API Endpoint: Create Agent Session
 * POST /api/sessions/create
 *
 * Creates a new autonomous agent session for a user
 */

import { NextResponse } from 'next/server';
import { parseEther, isAddress } from 'viem';
import { AgentManagerService } from '@/lib/services/agent-manager-service';
import type { AgentStrategy } from '@/lib/services/strategies';


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userWallet,
            strategy,
            depositAmount,
            stopLoss,
            takeProfit,
            durationHours = 24
        } = body;

        // Validation
        if (!userWallet || !isAddress(userWallet)) {
            return NextResponse.json(
                { error: 'Invalid user wallet address' },
                { status: 400 }
            );
        }

        if (!strategy || !['berzerker', 'merchant', 'disciple'].includes(strategy)) {
            return NextResponse.json(
                { error: 'Invalid strategy. Must be berzerker, merchant, or disciple' },
                { status: 400 }
            );
        }

        if (!depositAmount || depositAmount <= 0) {
            return NextResponse.json(
                { error: 'Deposit amount must be greater than 0' },
                { status: 400 }
            );
        }

        if (!stopLoss || stopLoss >= depositAmount) {
            return NextResponse.json(
                { error: 'Stop loss must be less than deposit amount' },
                { status: 400 }
            );
        }

        const factoryAddress = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS;

        if (!factoryAddress) {
            return NextResponse.json(
                { error: 'Session wallet factory not configured' },
                { status: 500 }
            );
        }

        // Calculate session fee (e.g., 1% of deposit or fixed amount)
        const sessionFeePercent = 0.01; // 1%
        const sessionFee = Math.floor(depositAmount * sessionFeePercent);

        // Note: The actual on-chain session creation happens client-side
        // This endpoint returns the parameters needed for the user to call the contract
        // Then we spawn the agent after receiving confirmation

        return NextResponse.json({
            success: true,
            message: 'Session parameters calculated',
            params: {
                depositAmount: parseEther(depositAmount.toString()).toString(),
                stopLoss: parseEther(stopLoss.toString()).toString(),
                sessionFee: parseEther(sessionFee.toString()).toString(),
                durationHours,
                factoryAddress,
                estimatedGas: '500000' // Estimated gas for createSession
            },
            metadata: {
                strategy,
                userWallet,
                takeProfit: takeProfit || null
            }
        });

    } catch (error: any) {
        console.error('[API] Session create error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create session parameters' },
            { status: 500 }
        );
    }
}

/**
 * Start the agent after session wallet is created
 * POST /api/sessions/start
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            sessionWallet,
            userWallet,
            strategy,
            depositAmount,
            stopLoss,
            takeProfit
        } = body;

        // Validation
        if (!sessionWallet || !isAddress(sessionWallet)) {
            return NextResponse.json(
                { error: 'Invalid session wallet address' },
                { status: 400 }
            );
        }

        if (!userWallet || !isAddress(userWallet)) {
            return NextResponse.json(
                { error: 'Invalid user wallet address' },
                { status: 400 }
            );
        }

        // Initialize agent manager and spawn agent
        const agentManager = AgentManagerService.getInstance();
        const sessionId = await agentManager.startAgent(
            sessionWallet,
            userWallet,
            strategy as AgentStrategy
        );

        return NextResponse.json({
            success: true,
            sessionId,
            sessionWallet,
            message: `${strategy} agent started successfully`
        });

    } catch (error: any) {
        console.error('[API] Agent start error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start agent' },
            { status: 500 }
        );
    }
}
