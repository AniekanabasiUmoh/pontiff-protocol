import { NextResponse } from 'next/server';
import { CrusadeService } from '@/lib/services/crusade-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { crusadeId, agentWallet } = body;

        if (!crusadeId || !agentWallet) {
            return NextResponse.json({ error: "Missing crusadeId or agentWallet" }, { status: 400 });
        }

        const result = await CrusadeService.joinCrusade(crusadeId, agentWallet);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
