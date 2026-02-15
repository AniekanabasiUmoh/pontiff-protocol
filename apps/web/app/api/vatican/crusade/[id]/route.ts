import { NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const supabase = createServerSupabase();
    const params = await props.params;
    const { data: crusade, error } = await supabase
        .from('Crusade')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ crusade });
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { outcome } = await request.json(); // "Victory" | "Defeat"
        await CrusadeService.resolveCrusade(params.id, outcome);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
