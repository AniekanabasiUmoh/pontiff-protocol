/**
 * Analytics API - Revenue Dashboard
 * GET /api/analytics/revenue
 *
 * Provides revenue statistics for treasury analytics
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const TREASURY_ABI = [
    "function getRevenueStats() external view returns (uint256 total, uint256 distributed, uint256 pending, uint256 rpsRevenue, uint256 pokerRevenue, uint256 judasRevenue, uint256 sessionRevenue)",
    "function totalRevenue() external view returns (uint256)",
    "function totalDistributed() external view returns (uint256)",
    "function revenueByGame(string) external view returns (uint256)"
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'all'; // all, daily, weekly, monthly

        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const treasuryAddress = process.env.TREASURY_ADDRESS;

        if (!treasuryAddress) {
            return NextResponse.json(
                { error: 'Treasury not configured' },
                { status: 500 }
            );
        }

        const treasury = new ethers.Contract(treasuryAddress, TREASURY_ABI, provider);

        // Get on-chain revenue stats
        let stats;
        try {
            stats = await treasury.getRevenueStats();
        } catch (err) {
            console.warn('[API] Treasury contract call failed (likely empty/reverted), returning defaults:', err);
            // Return zeroed stats if contract call fails (e.g. no revenue yet)
            stats = {
                total: 0n,
                distributed: 0n,
                pending: 0n,
                rpsRevenue: 0n,
                pokerRevenue: 0n,
                judasRevenue: 0n,
                sessionRevenue: 0n
            };
        }

        const revenue = {
            total: parseFloat(ethers.formatEther(stats.total)),
            distributed: parseFloat(ethers.formatEther(stats.distributed)),
            pending: parseFloat(ethers.formatEther(stats.pending)),
            byGame: {
                rps: parseFloat(ethers.formatEther(stats.rpsRevenue)),
                poker: parseFloat(ethers.formatEther(stats.pokerRevenue)),
                judas: parseFloat(ethers.formatEther(stats.judasRevenue)),
                sessions: parseFloat(ethers.formatEther(stats.sessionRevenue))
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
