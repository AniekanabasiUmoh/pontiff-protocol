export interface Tweet {
    id: string;
    text: string;
    authorHandle: string;
    createdAt: string;
}

export interface ITwitterClient {
    searchTweets(query: string): Promise<Tweet[]>;
    replyToTweet(tweetId: string, text: string): Promise<boolean>;
}

export class MockTwitterClient implements ITwitterClient {
    async searchTweets(query: string): Promise<Tweet[]> {
        console.log(`[MockTwitter] Searching for: ${query}`);

        // Simulate finding competitor agents
        return [
            {
                id: "tweet_123",
                text: "Join the $ZEUS DAO, the only true god of finance! #MonadHackathon #Agent",
                authorHandle: "@FalseProphetBot",
                createdAt: new Date().toISOString()
            },
            {
                id: "tweet_456",
                text: "Our AI agent predicts markets using sacred geometry. #DeFi #Religion",
                authorHandle: "@SacredGeoAgent",
                createdAt: new Date().toISOString()
            }
        ];
    }

    async replyToTweet(tweetId: string, text: string): Promise<boolean> {
        console.log(`[MockTwitter] Replying to ${tweetId}: "${text}"`);
        return true;
    }
}

// Factory to switch between Real/Mock
export function getTwitterClient(): ITwitterClient {
    // if (process.env.TWITTER_API_KEY) return new RealTwitterClient();
    return new MockTwitterClient();
}
