import { NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';

export async function POST(request: Request) {
    try {
        const { targetAgent, goalType } = await request.json();

        // Auth check should go here (Admin only)

        const crusade = await CrusadeService.createCrusade(targetAgent, goalType);

        return NextResponse.json({ success: true, crusade });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
