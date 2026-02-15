import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

export async function POST(request: NextRequest) {
    const sessionId = request.cookies.get("siwe-session-id")?.value;
    if (sessionId) {
        const supabase = createServerSupabase();
        await supabase.from("auth_sessions").delete().eq("id", sessionId);
    }
    const response = NextResponse.json({ success: true });
    response.cookies.delete("siwe-session-id");
    return response;
}
