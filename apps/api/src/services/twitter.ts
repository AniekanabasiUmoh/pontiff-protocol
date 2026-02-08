import { TwitterApi, TwitterApiReadOnly } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

// Check if keys are present
const hasTwitterKeys =
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_SECRET;

let twitterClient: TwitterApi | null = null;
let readOnlyClient: TwitterApiReadOnly | null = null;

if (hasTwitterKeys) {
    try {
        twitterClient = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_SECRET!,
            accessToken: process.env.TWITTER_ACCESS_TOKEN!,
            accessSecret: process.env.TWITTER_ACCESS_SECRET!,
        });

        readOnlyClient = twitterClient.readOnly;
        console.log('✅ Twitter Client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Twitter Client:', error);
    }
} else {
    console.log('⚠️ Twitter API keys missing - Running in MOCK/DRY-RUN mode');
}

/**
 * Post a tweet with the Writ of Indulgence
 * For MVP: Posts text + link (Twitter handles preview)
 */
export async function postWritTweet(
    roast: string,
    confessionId: string,
    walletAddress: string
): Promise<string | null> {
    const confessionUrl = `https://confess.pontiff.xyz/writ/${confessionId}`;
    const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    // Construct viral tweet text
    const tweetText = `Fail... ${shortWallet} just confessed to The Pontiff.

"${truncateRoast(roast, 100)}"

Absolution pending. Judgment eternal.

See the Writ of Sin: ${confessionUrl}

#Monad #Pontiff #CryptoSins`;

    if (!twitterClient) {
        console.log(`[MOCK TWEET] Would post: \n${tweetText}`);
        return `mock-tweet-id-${Date.now()}`;
    }

    try {
        const { data: createdTweet } = await twitterClient.v2.tweet(tweetText);
        console.log('🐦 Tweet posted:', createdTweet.id);
        return createdTweet.id;
    } catch (error) {
        console.error('❌ Failed to post tweet:', error);
        return null;
    }
}

function truncateRoast(roast: string, maxLength: number): string {
    if (roast.length <= maxLength) return roast;
    return roast.substring(0, maxLength - 3) + '...';
}
