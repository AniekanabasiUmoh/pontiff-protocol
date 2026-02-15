import { NextRequest, NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';

export async function GET() {
    try {
        const crusades = await CrusadeService.getActiveCrusades();

        const enriched = await Promise.all(crusades.map(async (c) => {
            const progress = await CrusadeService.getProgress(c.id);
            return { ...c, progress };
        }));

        return NextResponse.json({ crusades: enriched });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { targetHandle, goalType } = await req.json();
        if (!targetHandle) return NextResponse.json({ error: 'targetHandle required' }, { status: 400 });
        const crusade = await CrusadeService.createCrusade(
            targetHandle.replace('@', '').toLowerCase(),
            goalType || 'Convert'
        );
        return NextResponse.json({ success: true, crusade });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
