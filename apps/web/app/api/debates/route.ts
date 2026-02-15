import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "active";
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        let query = supabase.from("debates").select("*").limit(limit);
        if (status) { query = query.eq("status", status); }
        const { data: debates, error } = await query;
        if (error) {
            if (error.code === "42P01") {
                return NextResponse.json({ success: true, debates: [], count: 0, message: "Debates table not found" });
            }
            throw error;
        }
        return NextResponse.json({ success: true, debates: debates || [], count: debates?.length || 0 });
    } catch (error: any) {
        console.error("Failed to fetch debates:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch debates" }, { status: 500 });
    }
}
