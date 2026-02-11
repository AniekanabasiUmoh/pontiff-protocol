import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, personality, name } = body;

    if (!wallet || !personality) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, personality' },
        { status: 400 }
      );
    }

    const agentId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      agentId,
      wallet,
      personality,
      name: name || 'Agent ' + agentId.substring(0, 8),
      status: 'deploying',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}
