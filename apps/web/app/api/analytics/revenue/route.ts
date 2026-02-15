/**
 * Analytics API - Revenue Dashboard
 * GET /api/analytics/revenue
 *
 * Provides revenue statistics for treasury analytics
 */

import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { monadTestnet } from 'viem/chains';

const TREASURY_ABI = parseAbi([
    "function getRevenueStats() external view returns (uint256 total, uint256 distributed, uint256 pending, uint256 rpsRevenue, uint256 pokerRevenue, uint256 judasRevenue, uint256 sessionRevenue)",
    "function totalRevenue() external view returns (uint256)",
    "function totalDistributed() external view returns (uint256)",
    "function revenueByGame(string) external view returns (uint256)"
]);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'all'; // all, daily, weekly, monthly

        const treasuryAddress = process.env.TREASURY_ADDRESS;

        if (!treasuryAddress) {
            return NextResponse.json(
                { error: 'Treasury not configured' },
                { status: 500 }
            );
        }

        const publicClient = createPublicClient({
            chain: monadTestnet,
            transport: http(process.env.NEXT_PUBLIC_RPC_URL),
        });

        // Get on-chain revenue stats
        let stats: any;
        try {
            stats = await publicClient.readContract({
                address: treasuryAddress as `0x${string}`,
                abi: TREASURY_ABI,
                functionName: 'getRevenueStats',
            });
        } catch (err) {
            console.warn('[API] Treasury contract call failed (likely empty/reverted), returning defaults:', err);
            stats = { total: 0n, distributed: 0n, pending: 0n, rpsRevenue: 0n, pokerRevenue: 0n, judasRevenue: 0n, sessionRevenue: 0n };
        }

        const revenue = {
            total: parseFloat(formatEther(stats.total ?? stats[0] ?? 0n)),
            distributed: parseFloat(formatEther(stats.distributed ?? stats[1] ?? 0n)),
            pending: parseFloat(formatEther(stats.pending ?? stats[2] ?? 0n)),
            byGame: {
                rps: parseFloat(formatEther(stats.rpsRevenue ?? stats[3] ?? 0n)),
                poker: parseFloat(formatEther(stats.pokerRevenue ?? stats[4] ?? 0n)),
                judas: parseFloat(formatEther(stats.judasRevenue ?? stats[5] ?? 0n)),
                sessions: parseFloat(formatEther(stats.sessionRevenue ?? stats[6] ?? 0n)),
            }
        };

        // Calculate distribution
        const distribution = {
            staking: revenue.distributed * 0.6,
            team: revenue.distributed * 0.3,
            operations: revenue.distributed * 0.1
        };

        return NextResponse.json({
            period,
            revenue,
            distribution,
            stats: {
                averageGameRevenue: revenue.total > 0 ? (
                    (revenue.byGame.rps + revenue.byGame.poker + revenue.byGame.judas) /
                    (revenue.byGame.rps > 0 ? 1 : 0 + revenue.byGame.poker > 0 ? 1 : 0 + revenue.byGame.judas > 0 ? 1 : 0)
                ).toFixed(2) : 0,
                pendingDistribution: revenue.pending,
                distributionRate: revenue.total > 0 ? ((revenue.distributed / revenue.total) * 100).toFixed(2) : 0
            }
        });

    } catch (error: any) {
        console.error('[API] Revenue analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch revenue data' },
            { status: 500 }
        );
    }
}
