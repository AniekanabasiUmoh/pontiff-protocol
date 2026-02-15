import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { count: totalConfessions } = await supabase
            .from("confessions")
            .select("*", { count: "exact", head: true });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recentConfessions } = await supabase
            .from("confessions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", oneDayAgo);
        const { data: topSinners } = await supabase
            .from("confessions")
            .select("wallet_address")
            .limit(1000);
        const sinCounts: Record<string, number> = {};
        topSinners?.forEach(c => {
            sinCounts[c.wallet_address] = (sinCounts[c.wallet_address] || 0) + 1;
        });
        const topSinnersRanked = Object.entries(sinCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([wallet, count]) => ({ wallet, confessionCount: count }));
        return NextResponse.json({
            success: true,
            stats: { totalConfessions: totalConfessions || 0, last24Hours: recentConfessions || 0, topSinners: topSinnersRanked }
        });
    } catch (error: any) {
        console.error("Failed to fetch confession stats:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
    }
}
