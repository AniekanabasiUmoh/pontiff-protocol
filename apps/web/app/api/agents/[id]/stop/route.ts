import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      agentId: id,
      status: 'stopped',
      stoppedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop agent' },
      { status: 500 }
    );
  }
}
