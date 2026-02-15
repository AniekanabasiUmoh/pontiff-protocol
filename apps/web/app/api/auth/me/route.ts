import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function GET(request: NextRequest) {
    const sessionId = request.cookies.get("siwe-session-id")?.value;
    if (!sessionId) {
        return NextResponse.json({ authenticated: false });
    }
    try {
        const supabase = createServerSupabase();
        const { data: session, error } = await supabase
            .from("auth_sessions")
            .select("*")
            .eq("id", sessionId)
            .gt("expires_at", new Date().toISOString())
            .single();
        if (error || !session) {
            return NextResponse.json({ authenticated: false });
        }
        await supabase.from("auth_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sessionId);
        return NextResponse.json({ authenticated: true, address: session.wallet_address, chainId: session.chain_id });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({ authenticated: false });
    }
}
