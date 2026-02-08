import { NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';

export async function GET() {
    try {
        const crusades = await CrusadeService.getActiveCrusades();

        // Enrich with real-time progress
        const enriched = await Promise.all(crusades.map(async (c) => {
            const progress = await CrusadeService.getProgress(c.id);
            return { ...c, progress };
        }));

        return NextResponse.json({ crusades: enriched });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
