import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const wallet = searchParams.get("wallet");
        let query = supabase.from("rps_games").select("*").order("created_at", { ascending: false }).limit(limit);
        if (wallet) { query = query.eq("player_address", wallet.toLowerCase()); }
        const { data: games, error } = await query;
        if (error) throw error;
        return NextResponse.json({ success: true, games: games || [], count: games?.length || 0 });
    } catch (error: any) {
        console.error("Failed to fetch RPS history:", error);
        if (error.code === "42P01" || error.message?.includes("schema cache")) {
            return NextResponse.json({ success: true, games: [], count: 0, message: "RPS games table not found" });
        }
        return NextResponse.json({ error: error.message || "Failed to fetch history" }, { status: 500 });
    }
}
