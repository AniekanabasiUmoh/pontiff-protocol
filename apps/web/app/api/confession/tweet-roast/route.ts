import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * Module 12: Public Roast Tweet Integration
 *
 * Posts roasts to Twitter for users who:
 * - Decline to confess after wallet scan
 * - Have exceptionally high sin scores
 * - Opt-in to public shaming
 *
 * Twitter API v2 integration with rate limiting
 */

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

const MOCK_MODE = !TWITTER_ACCESS_TOKEN; // Use mock mode if credentials not configured

interface TweetRequest {
    walletAddress: string;
    roast: string;
    sinScore?: number;
    optInPublic?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body: TweetRequest = await request.json();
        const { walletAddress, roast, sinScore, optInPublic } = body;

        // Validate input
        if (!walletAddress || !roast) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, roast' },
                { status: 400 }
            );
        }

        // Check if user has opted in to public roasting
        if (!optInPublic) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User has not opted in to public roasting',
                    mockMode: MOCK_MODE
                },
                { status: 403 }
            );
        }

        // Construct tweet text (limit to 280 characters)
        const tweetText = constructTweet(walletAddress, roast, sinScore);

        if (MOCK_MODE) {
            // Mock mode: Store tweet in database but don't post to Twitter
            console.log('[Tweet Roast] MOCK MODE - Would post:', tweetText);

            const { data: mockTweet, error } = await supabase
                .from('roast_tweets')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    tweet_text: tweetText,
                    sin_score: sinScore,
                    posted: false,
                    mock_mode: true,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('[Tweet Roast] Mock insert error:', error);
            }

            return NextResponse.json({
                success: true,
                mockMode: true,
                tweetText,
                tweetId: mockTweet?.id,
                message: 'Tweet created in mock mode (not posted to Twitter)'
            });
        }

        // Real Twitter posting
        try {
            const tweetResponse = await postToTwitter(tweetText);

            // Store tweet record in database
            const { data: tweet, error: dbError } = await supabase
                .from('roast_tweets')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    tweet_text: tweetText,
                    sin_score: sinScore,
                    posted: true,
                    twitter_tweet_id: tweetResponse.tweetId,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (dbError) {
                console.error('[Tweet Roast] Database insert error:', dbError);
            }

            console.log(`[Tweet Roast] Posted: ${tweetResponse.tweetUrl}`);

            return NextResponse.json({
                success: true,
                tweetText,
                tweetId: tweetResponse.tweetId,
                tweetUrl: tweetResponse.tweetUrl,
                message: '🔥 Your sins have been publicly announced!'
            });

        } catch (twitterError: any) {
            console.error('[Tweet Roast] Twitter API error:', twitterError);

            // Fall back to mock mode on Twitter API failure
            const { data: fallbackTweet } = await supabase
                .from('roast_tweets')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    tweet_text: tweetText,
                    sin_score: sinScore,
                    posted: false,
                    error_message: twitterError.message,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            return NextResponse.json({
                success: false,
                error: 'Twitter API error',
                message: twitterError.message,
                fallbackMode: true,
                tweetId: fallbackTweet?.id
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[Tweet Roast] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to retrieve roast tweet history
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing wallet parameter' },
                { status: 400 }
            );
        }

        // Fetch tweet history for wallet
        const { data: tweets, error } = await supabase
            .from('roast_tweets')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('[Tweet History] Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch tweet history' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tweets: tweets || [],
            count: tweets?.length || 0
        });

    } catch (error: any) {
        console.error('[Tweet History] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * Construct tweet text from roast and wallet
 */
function constructTweet(walletAddress: string, roast: string, sinScore?: number): string {
    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    let tweet = `🔥 DIVINE ROAST 🔥\n\n`;
    tweet += `Wallet: ${shortAddress}\n`;

    if (sinScore) {
        tweet += `Sin Score: ${sinScore}\n`;
    }

    tweet += `\n${roast}\n\n`;
    tweet += `#ThePontiff #Confession #Web3`;

    // Ensure tweet is under 280 characters
    if (tweet.length > 280) {
        const maxRoastLength = 280 - (tweet.length - roast.length) - 3; // -3 for "..."
        const truncatedRoast = roast.substring(0, maxRoastLength) + '...';

        tweet = `🔥 DIVINE ROAST 🔥\n\n`;
        tweet += `Wallet: ${shortAddress}\n`;
        if (sinScore) {
            tweet += `Sin Score: ${sinScore}\n`;
        }
        tweet += `\n${truncatedRoast}\n\n`;
        tweet += `#ThePontiff #Confession #Web3`;
    }

    return tweet;
}

/**
 * Post to Twitter using Twitter API v2
 */
async function postToTwitter(tweetText: string): Promise<{ tweetId: string; tweetUrl: string }> {
    // Twitter API v2 endpoint
    const url = 'https://api.twitter.com/2/tweets';

    // OAuth 1.0a signature (simplified - in production use a proper OAuth library)
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: tweetText
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const tweetId = data.data.id;
    const tweetUrl = `https://twitter.com/ThePontiff/status/${tweetId}`;

    return { tweetId, tweetUrl };
}
