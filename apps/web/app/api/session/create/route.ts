import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, gameType } = body;

    if (!wallet || !gameType) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, gameType' },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      sessionId,
      gameType,
      wallet,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
