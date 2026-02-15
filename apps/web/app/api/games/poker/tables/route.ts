import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { data: tables, error } = await supabase
            .from("poker_tables")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });
        if (error) {
            console.log("Poker tables query error (expected):", error.message);
            return NextResponse.json({ success: true, tables: [], count: 0, message: "Poker tables not yet implemented" });
        }
        return NextResponse.json({ success: true, tables: tables || [], count: tables?.length || 0 });
    } catch (error: any) {
        console.error("Failed to fetch poker tables:", error);
        return NextResponse.json({ success: true, tables: [], count: 0, message: "Poker tables not available" });
    }
}
