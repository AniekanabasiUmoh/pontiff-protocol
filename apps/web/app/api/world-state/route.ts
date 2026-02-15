import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const [
            { count: totalConfessions },
            { count: activeAgents },
            { count: totalGames },
            { count: activeCrusades },
            { count: activeCardinals },
            { data: recentMatches }
        ] = await Promise.all([
            supabase.from("confessions").select("*", { count: "exact", head: true }),
            supabase.from("agent_sessions").select("*", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("rps_games").select("*", { count: "exact", head: true }),
            supabase.from("crusades").select("*", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("cardinal_members").select("*", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("pvp_matches").select("*").eq("status", "completed").order("created_at", { ascending: false }).limit(5)
        ]);
        const { data: pope } = await supabase.from("cardinal_members").select("wallet_address").eq("is_pope", true).single();
        const { data: deposits } = await supabase.from("agent_sessions").select("deposit_amount, current_balance");
        const tvl = deposits?.reduce((sum, d) => sum + parseFloat(d.current_balance || d.deposit_amount || "0"), 0) || 0;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentActivity } = await supabase.from("confessions").select("*", { count: "exact", head: true }).gte("created_at", oneHourAgo);
        return NextResponse.json({
            success: true,
            worldState: {
                totalConfessions: totalConfessions || 0, activeAgents: activeAgents || 0, totalGames: totalGames || 0,
                activeCrusades: activeCrusades || 0, activeCardinals: activeCardinals || 0,
                currentPope: pope?.wallet_address || null, totalValueLocked: tvl,
                recentActivity: recentActivity || 0, recentMatches: recentMatches?.length || 0,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error("Failed to fetch world state:", error);
        return NextResponse.json({
            success: true,
            worldState: {
                totalConfessions: 0, activeAgents: 0, totalGames: 0, activeCrusades: 0, activeCardinals: 0,
                currentPope: null, totalValueLocked: 0, recentActivity: 0, recentMatches: 0,
                lastUpdated: new Date().toISOString()
            },
            message: "Partial data available: " + error.message
        });
    }
}
