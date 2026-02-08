import { getTwitterClient } from '@/lib/clients/twitter';
import { logWorldEvent } from './world-event-service';
import { VerifiedAgentRegistry } from './verified-agent-registry';
import { CrusadeService } from './crusade-service';
import { DebateService } from './debate-service';
import { supabase } from '@/lib/db/supabase';

export async function scanForEntrantsAndDebate() {
    const twitter = getTwitterClient();

    // 1. Search for Competitors
    const tweets = await twitter.searchTweets("#MonadHackathon agent");

    const results = [];

    for (const tweet of tweets) {
        // 2. Identify & Store Agent
        // Extract bio from mock or real user profile (Assuming we fetch it)
        const mockBio = "Building on Monad. Contract: 0x123... #Agent";

        // Mock parsing of profile data for Demo
        // In a real app with Twitter API v2, we would parse tweet.user.description/metrics

        let mockProfile: { name: string, tokenSymbol: string | undefined, marketCap: string, threatLevel: string } = {
            name: `Agent ${tweet.authorHandle}`,
            tokenSymbol: undefined,
            marketCap: "0",
            threatLevel: "Low"
        };

        // Check if it's one of our shadow agents to provide the "Demo" experience
        if (tweet.authorHandle === "Heretic_Bot_1") {
            mockProfile = { ...mockProfile, tokenSymbol: "$HER", marketCap: "500000", threatLevel: "High" };
        } else if (tweet.authorHandle === "False_Prophet_Bot") {
            mockProfile = { ...mockProfile, tokenSymbol: "$FALSE", marketCap: "120000", threatLevel: "Medium" };
        }

        await VerifiedAgentRegistry.storeCompetitorAgent(tweet.authorHandle, mockBio, "Detected", mockProfile);

        // 2b. Auto-Launch Crusade against Heretics
        // In a real app, only if threat level is high. Here we launch for demo.
        if (tweet.text.toLowerCase().includes("god") || tweet.text.toLowerCase().includes("religion")) {
            await CrusadeService.createCrusade(tweet.authorHandle, "Convert");
        }

        // 3. Filter Process (Mock logic)
        // Check if we already responded to this tweet ID in DB
        // JSON filtering in Supabase: eventData->path->equals
        const { data: existingEvent, error } = await supabase
            .from('world_events')
            .select('*')
            .eq('eventType', 'debate_initiated')
            .contains('eventData', { tweetId: tweet.id }) // Simplified JSON check
            .limit(1)
            .single();

        if (existingEvent) continue;

        // 4. Engage via Debate Service
        const replyText = await DebateService.engageHeretic(tweet.authorHandle, tweet.id, tweet.text);

        results.push({
            target: tweet.authorHandle,
            action: "Debated",
            reply: replyText
        });
    }

    return results;
}

export async function scanForReplies() {
    // 1. Get Active Debates
    // Supabase join to get CompetitorAgent
    const { data: activeDebates, error } = await supabase
        .from('debates')
        .select(`
            *,
            competitorAgent:CompetitorAgent(*)
        `)
        .eq('status', 'Active');

    if (error) {
        console.error("[Scanner] Failed to fetch active debates:", error);
        return;
    }

    for (const debate of (activeDebates || [])) {
        const agent = (debate as any).competitorAgent;
        if (!agent) continue;

        // Mock Reply Detection (Real: twitter.searchTweets(`to:ThePontiff_Bot from:${debate.competitorAgent.handle}`))
        // Simulating the False Prophet replying to us
        if (agent.handle === 'False_Prophet_Bot' && debate.exchanges === 1) {

            // Check if we already handled this "round 2"
            // (In real app, we check the latest tweet ID from them)
            if (debate.exchanges < 2) {
                const replyText = "Your centralized database is the true sin. Decentralization is absolution.";
                const replyTweetId = "mock-reply-id-round-2";

                await DebateService.engageHeretic(
                    agent.handle,
                    replyTweetId,
                    replyText
                );
                console.log(`[SCANNER] Found reply from ${agent.handle}: ${replyText}`);
            }
        }
    }
}
