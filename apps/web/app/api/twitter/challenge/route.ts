import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, challengeText } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required field: agentId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: 'mock-tweet-' + Date.now(),
      agentId,
      challengeText: challengeText || 'Challenge accepted!',
      postedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to post Twitter challenge' },
      { status: 500 }
    );
  }
}
