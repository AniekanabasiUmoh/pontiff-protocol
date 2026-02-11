import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { debateId, announcement } = body;

    if (!debateId) {
      return NextResponse.json(
        { error: 'Missing required field: debateId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: 'mock-tweet-' + Date.now(),
      debateId,
      announcement: announcement || 'Debate announced!',
      postedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to post Twitter announcement' },
      { status: 500 }
    );
  }
}
