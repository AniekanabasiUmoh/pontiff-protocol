import { NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { outcome } = await request.json(); // "Victory" | "Defeat"
        await CrusadeService.resolveCrusade(params.id, outcome);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
