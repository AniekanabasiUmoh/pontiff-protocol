import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing required field: wallet' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet,
      cancelledAt: new Date().toISOString(),
      status: 'cancelled'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel cardinal membership' },
      { status: 500 }
    );
  }
}
