/**
 * Twitter API Client Configuration
 * 
 * Uses Twitter API v2 with OAuth 1.0a for posting tweets
 * Requires: TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, 
 *           TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 * 
 * Also supports Bearer token for read-only operations
 */

import { TwitterApi, TweetV2PostTweetResult } from 'twitter-api-v2';

// Singleton instance
let twitterClient: TwitterApi | null = null;
let isConfigured = false;

/**
 * Get configured Twitter client instance
 * Returns null if credentials are not configured
 */
export function getTwitterClient(): TwitterApi | null {
    if (twitterClient) return twitterClient;

    const consumerKey = process.env.TWITTER_CONSUMER_KEY;
    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    // Check if OAuth 1.0a credentials are available (needed for posting)
    if (consumerKey && consumerSecret && accessToken && accessSecret) {
        twitterClient = new TwitterApi({
            appKey: consumerKey,
            appSecret: consumerSecret,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });
        isConfigured = true;
        console.log('✅ Twitter client configured with OAuth 1.0a (read/write)');
        return twitterClient;
    }

    // Fallback to Bearer token (read-only)
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (bearerToken) {
        twitterClient = new TwitterApi(bearerToken);
        isConfigured = true;
        console.log('⚠️ Twitter client configured with Bearer token (read-only)');
        return twitterClient;
    }

    console.warn('❌ Twitter client not configured - missing credentials');
    return null;
}

/**
 * Check if Twitter client is configured
 */
export function isTwitterConfigured(): boolean {
    return isConfigured || !!getTwitterClient();
}

/**
 * Check if we can post tweets (have OAuth 1.0a credentials)
 */
export function canPostTweets(): boolean {
    const hasOAuth = !!(
        process.env.TWITTER_CONSUMER_KEY &&
        process.env.TWITTER_CONSUMER_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
    );
    return hasOAuth;
}

/**
 * Post a tweet (wrapper with error handling)
 */
export async function postTweet(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    const client = getTwitterClient();

    if (!client) {
        return { success: false, error: 'Twitter client not configured' };
    }

    if (!canPostTweets()) {
        console.log(`[MOCK TWEET] ${text}`);
        return { success: true, tweetId: `mock_${Date.now()}` };
    }

    try {
        const result = await client.v2.tweet(text);
        return { success: true, tweetId: result.data.id };
    } catch (error: any) {
        console.error('Tweet failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(
    text: string,
    inReplyToId: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    const client = getTwitterClient();

    if (!client) {
        return { success: false, error: 'Twitter client not configured' };
    }

    if (!canPostTweets()) {
        console.log(`[MOCK REPLY to ${inReplyToId}] ${text}`);
        return { success: true, tweetId: `mock_reply_${Date.now()}` };
    }

    try {
        const result = await client.v2.reply(text, inReplyToId);
        return { success: true, tweetId: result.data.id };
    } catch (error: any) {
        console.error('Reply failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search for tweets mentioning specific handles or hashtags
 */
export async function searchTweets(
    query: string,
    maxResults: number = 10
): Promise<{ success: boolean; tweets?: any[]; error?: string }> {
    const client = getTwitterClient();

    if (!client) {
        return { success: false, error: 'Twitter client not configured' };
    }

    try {
        const result = await client.v2.search(query, {
            max_results: maxResults,
            'tweet.fields': ['created_at', 'author_id', 'conversation_id'],
            expansions: ['author_id'],
        });

        const tweets = result.data?.data || [];
        return { success: true, tweets };
    } catch (error: any) {
        console.error('Search failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get mentions of our account
 */
export async function getMentions(
    sinceId?: string,
    maxResults: number = 20
): Promise<{ success: boolean; mentions?: any[]; error?: string }> {
    const client = getTwitterClient();

    if (!client) {
        return { success: false, error: 'Twitter client not configured' };
    }

    try {
        const me = await client.v2.me();
        const mentions = await client.v2.userMentionTimeline(me.data.id, {
            max_results: maxResults,
            since_id: sinceId,
            'tweet.fields': ['created_at', 'conversation_id', 'in_reply_to_user_id'],
        });

        return { success: true, mentions: mentions.data?.data || [] };
    } catch (error: any) {
        console.error('Get mentions failed:', error);
        return { success: false, error: error.message };
    }
}
