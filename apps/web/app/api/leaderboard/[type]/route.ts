import { NextResponse } from 'next/server';
import { LeaderboardService } from '@/lib/services/leaderboard-service';

export async function GET(request: Request, { params }: { params: { type: string } }) {
    try {
        const type = params.type as 'shame' | 'saints' | 'heretics';

        if (!['shame', 'saints', 'heretics'].includes(type)) {
            return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 });
        }

        const entries = await LeaderboardService.getLeaderboard(type);

        // Mock Data if Empty (For Demo Purpose)
        if (entries.length === 0) {
            return NextResponse.json({
                entries: generateMockData(type)
            });
        }

        return NextResponse.json({ entries });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateMockData(type: string) {
    if (type === 'saints') {
        return [
            { rank: 1, walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", score: 5000, metadata: { totalWins: 50, profit: 5000, stakeDays: 12, loyaltyScore: 99 } },
            { rank: 2, walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", score: 3200, metadata: { totalWins: 30, profit: 3200, stakeDays: 8, loyaltyScore: 95 } },
        ];
    }
    if (type === 'shame') {
        return [
            { rank: 1, walletAddress: "0xBad...Dumb", score: -10000, metadata: { totalLoss: 100, profit: -10000, totalWins: 1 } },
            { rank: 2, walletAddress: "0xDegen...Losing", score: -5400, metadata: { totalLoss: 40, profit: -5400 } },
        ];
    }
    // Heretics
    return [
        { rank: 1, walletAddress: "0xJudas...Real", score: 0, metadata: { failedCoupCount: 3, totalBetrayals: 5, totalLoss: -2000 } },
    ];
}
