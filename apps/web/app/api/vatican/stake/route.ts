import { NextResponse } from 'next/server';
import { validateAction } from '@/lib/middleware/validate-action';
import { StakeAction } from '@/lib/types/actions';

export async function POST(request: Request) {
    try {
        const body: StakeAction = await request.json();

        // 1. Validate
        await validateAction(body);

        const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS;

        // 2. Return On-Chain Instructions
        return NextResponse.json({
            success: true,
            data: {
                action: "call_contract",
                contractAddress: STAKING_ADDRESS,
                functionName: "stake",
                args: [body.amount],
                message: `Staking ${body.amount} Wei into the Cathedral. May your returns be blessed.`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
