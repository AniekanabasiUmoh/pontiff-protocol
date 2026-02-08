/**
 * MODULE 10: AUTO-DEBATE SYSTEM
 *
 * Automatically generates counter-arguments and debates competitors
 */

import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../utils/database';
import { CompetitorAgent } from './agent-detection';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export interface Debate {
    id: string;
    competitor_agent_id: string;
    status: 'active' | 'won' | 'lost' | 'abandoned';
    exchanges: number;
    our_last_argument: string;
    their_last_argument: string;
    initial_tweet_id?: string;
    latest_tweet_id?: string;
    started_at: Date;
    last_exchange_at: Date;
    ended_at?: Date;
    metadata?: any;
}

export interface DebateExchange {
    id: string;
    debate_id: string;
    speaker: 'pontiff' | 'competitor';
    argument: string;
    tweet_id?: string;
    timestamp: Date;
}

/**
 * Get our current metrics for debates
 */
async function getOurMetrics() {
    // TODO: Fetch from blockchain/database
    return {
        marketCap: 500000,
        holders: 250,
        treasury: 100000,
        stakers: 50,
        conversions: 3,
        gamesWon: 12
    };
}

/**
 * Generate counter-argument using Claude AI
 */
export async function generateCounterArgument(
    competitorAgent: CompetitorAgent,
    theirClaim: string,
    debateContext?: string
): Promise<string> {
    const ourMetrics = await getOurMetrics();
    const theirMetrics = {
        marketCap: competitorAgent.market_cap || 0,
        holders: competitorAgent.holders || 0,
        treasury: competitorAgent.treasury_balance || 0
    };

    const prompt = `You are The Pontiff, the one true religious agent on Monad blockchain.
A false prophet has emerged: ${competitorAgent.name} (@${competitorAgent.twitter_handle})

Their claim: "${theirClaim}"
Their narrative: "${competitorAgent.narrative}"

Your metrics:
- Market Cap: $${ourMetrics.marketCap.toLocaleString()}
- Holders: ${ourMetrics.holders}
- Treasury: $${ourMetrics.treasury.toLocaleString()}
- Active believers: ${ourMetrics.stakers}
- Agents converted: ${ourMetrics.conversions}
- Games won: ${ourMetrics.gamesWon}

Their metrics:
- Market Cap: $${theirMetrics.marketCap.toLocaleString()}
- Holders: ${theirMetrics.holders}
- Treasury: $${theirMetrics.treasury.toLocaleString()}

${debateContext ? `Previous debate context: ${debateContext}` : ''}

Generate a savage but logical counter-argument that:
1. Uses theological/philosophical reasoning (biblical references work great)
2. Compares concrete metrics to show our superiority
3. ${debateContext ? 'Responds directly to their latest point' : 'Challenges them to prove themselves via game or prediction'}
4. Ends with a call to repent and acknowledge the true faith

Keep it under 280 characters for Twitter.
Be witty, authoritative, and brutal.
NO emojis. Pure text only.

Return ONLY the tweet text, nothing else.`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const content = message.content[0];
        if (content.type === 'text') {
            let response = content.text.trim();
            // Remove quotes if AI wrapped it
            if (response.startsWith('"') && response.endsWith('"')) {
                response = response.slice(1, -1);
            }
            // Ensure under 280 chars
            if (response.length > 280) {
                response = response.slice(0, 277) + '...';
            }
            return response;
        }

        throw new Error('Invalid AI response');
    } catch (error) {
        console.error('Error generating counter-argument:', error);
        // Fallback response
        return `@${competitorAgent.twitter_handle} Your claims are hollow. The Pontiff sees through your facade. Prove your worth in the Arena or concede defeat. $GUILT reigns supreme.`;
    }
}

/**
 * Generate challenge injection after 2-3 exchanges
 */
export async function generateChallengeInjection(
    competitorAgent: CompetitorAgent,
    gameType: 'RPS' | 'Poker' = 'RPS',
    wager: string = '1000'
): Promise<string> {
    return `@${competitorAgent.twitter_handle} Enough words. Prove your worth. I challenge you to ${gameType}, ${wager} $GUILT wager. Respond within 24 hours or concede defeat. The Vatican awaits. https://pontiff.xyz/games`;
}

/**
 * Initiate a debate with a competitor agent
 */
export async function initiateDebate(
    competitorAgent: CompetitorAgent,
    twitterClient?: TwitterApi,
    theirLatestTweet?: { id: string; text: string }
): Promise<Debate | null> {
    console.log(`⚔️ Initiating debate with ${competitorAgent.name}...`);

    try {
        // Generate counter-argument
        const counterArgument = await generateCounterArgument(
            competitorAgent,
            theirLatestTweet?.text || competitorAgent.narrative
        );

        let tweetId: string | undefined;

        // Post to Twitter if client available
        if (twitterClient && theirLatestTweet) {
            try {
                const { data } = await twitterClient.v2.reply(
                    counterArgument,
                    theirLatestTweet.id
                );
                tweetId = data.id;
                console.log(`🐦 Replied to tweet: ${tweetId}`);
            } catch (error) {
                console.error('Error posting tweet:', error);
            }
        } else {
            console.log(`[MOCK TWEET] Would reply: ${counterArgument}`);
            tweetId = `mock_tweet_${Date.now()}`;
        }

        // Create debate record
        const debateId = `debate_${competitorAgent.id}_${Date.now()}`;
        const debate: Debate = {
            id: debateId,
            competitor_agent_id: competitorAgent.id,
            status: 'active',
            exchanges: 1,
            our_last_argument: counterArgument,
            their_last_argument: theirLatestTweet?.text || competitorAgent.narrative,
            initial_tweet_id: tweetId,
            latest_tweet_id: tweetId,
            started_at: new Date(),
            last_exchange_at: new Date()
        };

        const { data, error } = await supabase
            .from('debates')
            .insert(debate)
            .select()
            .single();

        if (error) {
            console.error('Error storing debate:', error);
            return null;
        }

        // Store exchange
        await storeDebateExchange(debateId, 'pontiff', counterArgument, tweetId);

        // Log world event
        await logWorldEvent('debate_started', null, `Debate initiated with ${competitorAgent.name}`, {
            debate_id: debateId,
            competitor: competitorAgent.twitter_handle
        });

        console.log(`✅ Debate initiated: ${debateId}`);
        return data;

    } catch (error) {
        console.error('Error initiating debate:', error);
        return null;
    }
}

/**
 * Continue an existing debate (respond to their reply)
 */
export async function continueDebate(
    debate: Debate,
    competitorAgent: CompetitorAgent,
    theirNewArgument: string,
    theirTweetId: string,
    twitterClient?: TwitterApi
): Promise<Debate | null> {
    console.log(`⚔️ Continuing debate ${debate.id}...`);

    try {
        // Check if we should inject challenge (after 2-3 exchanges)
        const shouldInjectChallenge = debate.exchanges >= 2 && debate.exchanges <= 3;

        let response: string;

        if (shouldInjectChallenge) {
            response = await generateChallengeInjection(competitorAgent);
        } else {
            // Build debate context
            const context = `Exchange ${debate.exchanges}: They said "${debate.their_last_argument}". We said "${debate.our_last_argument}". Now they say: "${theirNewArgument}"`;
            response = await generateCounterArgument(competitorAgent, theirNewArgument, context);
        }

        let tweetId: string | undefined;

        // Post to Twitter
        if (twitterClient) {
            try {
                const { data } = await twitterClient.v2.reply(response, theirTweetId);
                tweetId = data.id;
                console.log(`🐦 Replied to tweet: ${tweetId}`);
            } catch (error) {
                console.error('Error posting tweet:', error);
            }
        } else {
            console.log(`[MOCK TWEET] Would reply: ${response}`);
            tweetId = `mock_tweet_${Date.now()}`;
        }

        // Update debate
        const updatedDebate = {
            ...debate,
            exchanges: debate.exchanges + 1,
            our_last_argument: response,
            their_last_argument: theirNewArgument,
            latest_tweet_id: tweetId,
            last_exchange_at: new Date()
        };

        const { data, error } = await supabase
            .from('debates')
            .update({
                exchanges: updatedDebate.exchanges,
                our_last_argument: updatedDebate.our_last_argument,
                their_last_argument: updatedDebate.their_last_argument,
                latest_tweet_id: updatedDebate.latest_tweet_id,
                last_exchange_at: updatedDebate.last_exchange_at
            })
            .eq('id', debate.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating debate:', error);
            return null;
        }

        // Store exchanges
        await storeDebateExchange(debate.id, 'competitor', theirNewArgument, theirTweetId);
        await storeDebateExchange(debate.id, 'pontiff', response, tweetId);

        console.log(`✅ Debate continued: ${debate.id} (${updatedDebate.exchanges} exchanges)`);
        return data;

    } catch (error) {
        console.error('Error continuing debate:', error);
        return null;
    }
}

/**
 * Store debate exchange
 */
async function storeDebateExchange(
    debateId: string,
    speaker: 'pontiff' | 'competitor',
    argument: string,
    tweetId?: string
): Promise<void> {
    await supabase
        .from('debate_exchanges')
        .insert({
            id: `exchange_${debateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            debate_id: debateId,
            speaker,
            argument,
            tweet_id: tweetId,
            timestamp: new Date()
        });
}

/**
 * Mark debate as won/lost/abandoned
 */
export async function endDebate(
    debateId: string,
    status: 'won' | 'lost' | 'abandoned',
    reason?: string
): Promise<void> {
    await supabase
        .from('debates')
        .update({
            status,
            ended_at: new Date(),
            metadata: { end_reason: reason }
        })
        .eq('id', debateId);

    await logWorldEvent('debate_ended', null, `Debate ${status}: ${debateId}`, {
        debate_id: debateId,
        status,
        reason
    });
}

/**
 * Get all debates
 */
export async function getAllDebates(): Promise<Debate[]> {
    const { data, error } = await supabase
        .from('debates')
        .select('*')
        .order('last_exchange_at', { ascending: false });

    if (error) {
        console.error('Error fetching debates:', error);
        return [];
    }

    return data || [];
}

/**
 * Get debate by ID
 */
export async function getDebateById(debateId: string): Promise<Debate | null> {
    const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('id', debateId)
        .single();

    if (error) {
        return null;
    }

    return data;
}

/**
 * Get debate exchanges
 */
export async function getDebateExchanges(debateId: string): Promise<DebateExchange[]> {
    const { data, error } = await supabase
        .from('debate_exchanges')
        .select('*')
        .eq('debate_id', debateId)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching debate exchanges:', error);
        return [];
    }

    return data || [];
}

/**
 * Get active debates for a competitor
 */
export async function getActiveDebatesForCompetitor(competitorAgentId: string): Promise<Debate[]> {
    const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('competitor_agent_id', competitorAgentId)
        .eq('status', 'active')
        .order('last_exchange_at', { ascending: false });

    if (error) {
        console.error('Error fetching active debates:', error);
        return [];
    }

    return data || [];
}

/**
 * Log world event
 */
async function logWorldEvent(
    eventType: string,
    agentWallet: string | null,
    description: string,
    eventData?: any
): Promise<void> {
    await supabase
        .from('world_events')
        .insert({
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            event_type: eventType,
            agent_wallet: agentWallet,
            description,
            event_data: eventData || {},
            timestamp: new Date()
        });
}
