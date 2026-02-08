/**
 * MODULE 11: CONVERSION TRACKING
 *
 * Tracks when competitor agents acknowledge The Pontiff (Track 1 requirement)
 * Conversion signals:
 * 1. Acknowledgment in tweets (mentions, replies)
 * 2. Token purchase ($GUILT)
 * 3. Retweets/likes
 * 4. Challenge accepted (game participation)
 * 5. Game loss (competitive acknowledgment)
 */

import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../utils/database';
import { CompetitorAgent, getAllCompetitorAgents } from './agent-detection';
import { provider } from './blockchain';
import { ethers } from 'ethers';

export interface Conversion {
    id: string;
    competitor_agent_id: string;
    conversion_type: 'acknowledgment' | 'token_purchase' | 'retweet' | 'challenge_accepted' | 'game_loss';
    evidence_type: 'tweet' | 'transaction' | 'game';
    evidence_data: any;
    timestamp: Date;
    verified: boolean;
}

const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS || '';
const PONTIFF_TWITTER_HANDLE = process.env.PONTIFF_TWITTER_HANDLE || 'thepontiff';

/**
 * Acknowledgment phrases that indicate conversion
 */
const ACKNOWLEDGMENT_PHRASES = [
    'the pontiff has a point',
    'respect to @thepontiff',
    'pontiff is right',
    "can't argue with that",
    'fair point',
    'you win',
    'i concede',
    '$guilt is impressive',
    'the pontiff wins',
    'acknowledge',
    'the vatican',
    'impressed',
    'well played',
    'fair enough',
    'touché',
    'you got me',
    'i admit'
];

/**
 * Track all conversions for all competitor agents
 */
export async function trackAllConversions(twitterClient?: TwitterApi): Promise<Conversion[]> {
    console.log('🎯 Tracking conversions for all competitors...');

    const competitors = await getAllCompetitorAgents();
    const conversions: Conversion[] = [];

    for (const competitor of competitors) {
        const competitorConversions = await trackConversionsForCompetitor(competitor, twitterClient);
        conversions.push(...competitorConversions);
    }

    console.log(`✅ Tracked ${conversions.length} total conversions`);
    return conversions;
}

/**
 * Track conversions for a specific competitor agent
 */
export async function trackConversionsForCompetitor(
    competitor: CompetitorAgent,
    twitterClient?: TwitterApi
): Promise<Conversion[]> {
    console.log(`🔍 Checking conversions for ${competitor.name}...`);

    const conversions: Conversion[] = [];

    // Check 1: Twitter acknowledgment
    if (twitterClient) {
        const acknowledgment = await checkTwitterAcknowledgment(competitor, twitterClient);
        if (acknowledgment) {
            conversions.push(acknowledgment);
        }

        // Check 2: Retweets
        const retweet = await checkRetweets(competitor, twitterClient);
        if (retweet) {
            conversions.push(retweet);
        }
    }

    // Check 3: Token purchase
    if (competitor.contract_address) {
        const tokenPurchase = await checkTokenPurchase(competitor);
        if (tokenPurchase) {
            conversions.push(tokenPurchase);
        }
    }

    // Check 4: Challenge accepted
    const challengeAccepted = await checkChallengeAccepted(competitor);
    if (challengeAccepted) {
        conversions.push(challengeAccepted);
    }

    // Check 5: Game loss
    const gameLoss = await checkGameLoss(competitor);
    if (gameLoss) {
        conversions.push(gameLoss);
    }

    // Store new conversions
    for (const conversion of conversions) {
        await storeConversion(conversion);
    }

    return conversions;
}

/**
 * Check if competitor mentioned/acknowledged Pontiff on Twitter
 */
async function checkTwitterAcknowledgment(
    competitor: CompetitorAgent,
    twitterClient: TwitterApi
): Promise<Conversion | null> {
    try {
        // Search for tweets from competitor mentioning Pontiff
        const query = `from:${competitor.twitter_handle} @${PONTIFF_TWITTER_HANDLE}`;
        const tweets = await twitterClient.v2.search(query, {
            max_results: 10,
            'tweet.fields': ['created_at', 'text']
        });

        for await (const tweet of tweets) {
            if (detectAcknowledgment(tweet.text)) {
                // Check if we already recorded this
                const exists = await conversionExists(competitor.id, 'acknowledgment', tweet.id);
                if (exists) continue;

                return {
                    id: `conv_ack_${competitor.id}_${Date.now()}`,
                    competitor_agent_id: competitor.id,
                    conversion_type: 'acknowledgment',
                    evidence_type: 'tweet',
                    evidence_data: {
                        tweet_id: tweet.id,
                        tweet_text: tweet.text,
                        timestamp: tweet.created_at
                    },
                    timestamp: new Date(),
                    verified: true
                };
            }
        }
    } catch (error) {
        console.error('Error checking Twitter acknowledgment:', error);
    }

    return null;
}

/**
 * Detect acknowledgment in tweet text
 */
function detectAcknowledgment(text: string): boolean {
    const lowerText = text.toLowerCase();
    return ACKNOWLEDGMENT_PHRASES.some(phrase => lowerText.includes(phrase));
}

/**
 * Check if competitor retweeted Pontiff
 */
async function checkRetweets(
    competitor: CompetitorAgent,
    twitterClient: TwitterApi
): Promise<Conversion | null> {
    try {
        // Search for retweets from competitor
        const query = `from:${competitor.twitter_handle} @${PONTIFF_TWITTER_HANDLE}`;
        const tweets = await twitterClient.v2.search(query, {
            max_results: 10,
            'tweet.fields': ['referenced_tweets']
        });

        for await (const tweet of tweets) {
            const isRetweet = tweet.referenced_tweets?.some(ref => ref.type === 'retweeted');
            if (isRetweet) {
                const exists = await conversionExists(competitor.id, 'retweet', tweet.id);
                if (exists) continue;

                return {
                    id: `conv_rt_${competitor.id}_${Date.now()}`,
                    competitor_agent_id: competitor.id,
                    conversion_type: 'retweet',
                    evidence_type: 'tweet',
                    evidence_data: {
                        tweet_id: tweet.id,
                        retweeted_at: new Date()
                    },
                    timestamp: new Date(),
                    verified: true
                };
            }
        }
    } catch (error) {
        console.error('Error checking retweets:', error);
    }

    return null;
}

/**
 * Check if competitor bought $GUILT tokens
 */
async function checkTokenPurchase(competitor: CompetitorAgent): Promise<Conversion | null> {
    if (!competitor.contract_address) return null;

    try {
        // Create GUILT token contract interface
        const guiltAbi = [
            'event Transfer(address indexed from, address indexed to, uint256 value)'
        ];
        const guiltContract = new ethers.Contract(GUILT_TOKEN_ADDRESS, guiltAbi, provider);

        // Check for Transfer events to competitor's contract
        const filter = guiltContract.filters.Transfer(null, competitor.contract_address);
        const events = await guiltContract.queryFilter(filter, -10000); // Last ~10k blocks

        if (events.length > 0) {
            const latestEvent = events[events.length - 1];
            const txHash = latestEvent.transactionHash;

            // Check if we already recorded this
            const exists = await conversionExists(competitor.id, 'token_purchase', txHash);
            if (exists) return null;

            return {
                id: `conv_buy_${competitor.id}_${Date.now()}`,
                competitor_agent_id: competitor.id,
                conversion_type: 'token_purchase',
                evidence_type: 'transaction',
                evidence_data: {
                    transaction_hash: txHash,
                    block_number: latestEvent.blockNumber,
                    amount: latestEvent.args?.value.toString()
                },
                timestamp: new Date(),
                verified: true
            };
        }
    } catch (error) {
        console.error('Error checking token purchase:', error);
    }

    return null;
}

/**
 * Check if competitor accepted a challenge (game participation)
 */
async function checkChallengeAccepted(competitor: CompetitorAgent): Promise<Conversion | null> {
    // Query games table for matches involving this competitor
    // This assumes we have a games table from Module 5-7
    const { data: games } = await supabase
        .from('games')
        .select('*')
        .or(`player1.eq.${competitor.contract_address},player2.eq.${competitor.contract_address}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

    if (games && games.length > 0) {
        const game = games[0];

        // Check if we already recorded this
        const exists = await conversionExists(competitor.id, 'challenge_accepted', game.id);
        if (exists) return null;

        return {
            id: `conv_challenge_${competitor.id}_${Date.now()}`,
            competitor_agent_id: competitor.id,
            conversion_type: 'challenge_accepted',
            evidence_type: 'game',
            evidence_data: {
                game_id: game.id,
                game_type: game.game_type,
                wager: game.wager
            },
            timestamp: new Date(),
            verified: true
        };
    }

    return null;
}

/**
 * Check if competitor lost a game (competitive acknowledgment)
 */
async function checkGameLoss(competitor: CompetitorAgent): Promise<Conversion | null> {
    const pontiffWallet = process.env.PONTIFF_WALLET || '';

    // Query for games where competitor lost to Pontiff
    const { data: games } = await supabase
        .from('games')
        .select('*')
        .or(`player1.eq.${competitor.contract_address},player2.eq.${competitor.contract_address}`)
        .eq('winner', pontiffWallet)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

    if (games && games.length > 0) {
        const game = games[0];

        // Check if we already recorded this
        const exists = await conversionExists(competitor.id, 'game_loss', game.id);
        if (exists) return null;

        return {
            id: `conv_loss_${competitor.id}_${Date.now()}`,
            competitor_agent_id: competitor.id,
            conversion_type: 'game_loss',
            evidence_type: 'game',
            evidence_data: {
                game_id: game.id,
                game_type: game.game_type,
                wager: game.wager,
                result: game.result
            },
            timestamp: new Date(),
            verified: true
        };
    }

    return null;
}

/**
 * Check if conversion already exists
 */
async function conversionExists(
    competitorAgentId: string,
    conversionType: string,
    evidenceId: string
): Promise<boolean> {
    const { data } = await supabase
        .from('conversions')
        .select('id')
        .eq('competitor_agent_id', competitorAgentId)
        .eq('conversion_type', conversionType)
        .like('evidence_data', `%${evidenceId}%`)
        .single();

    return !!data;
}

/**
 * Store conversion in database
 */
async function storeConversion(conversion: Conversion): Promise<void> {
    const { error } = await supabase
        .from('conversions')
        .insert(conversion);

    if (error) {
        console.error('Error storing conversion:', error);
        return;
    }

    // Log world event
    await logWorldEvent('conversion', null, `Conversion recorded: ${conversion.conversion_type}`, {
        conversion_id: conversion.id,
        competitor_agent_id: conversion.competitor_agent_id,
        conversion_type: conversion.conversion_type
    });

    console.log(`✅ Conversion stored: ${conversion.id} (${conversion.conversion_type})`);
}

/**
 * Get all conversions
 */
export async function getAllConversions(): Promise<Conversion[]> {
    const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching conversions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get conversions for a specific competitor
 */
export async function getConversionsForCompetitor(competitorAgentId: string): Promise<Conversion[]> {
    const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('competitor_agent_id', competitorAgentId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching conversions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get conversion count by type
 */
export async function getConversionStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    verified: number;
}> {
    const conversions = await getAllConversions();

    const stats = {
        total: conversions.length,
        byType: {} as Record<string, number>,
        verified: conversions.filter(c => c.verified).length
    };

    for (const conversion of conversions) {
        stats.byType[conversion.conversion_type] = (stats.byType[conversion.conversion_type] || 0) + 1;
    }

    return stats;
}

/**
 * Announce conversion on Twitter
 */
export async function announceConversion(
    conversion: Conversion,
    competitor: CompetitorAgent,
    twitterClient?: TwitterApi
): Promise<void> {
    let tweetText = '🎉 CONVERSION 🎉\n\n';

    switch (conversion.conversion_type) {
        case 'acknowledgment':
            tweetText += `${competitor.name} (@${competitor.twitter_handle}) has seen the light! They acknowledged The Pontiff's truth.\n\n`;
            break;
        case 'token_purchase':
            tweetText += `${competitor.name} has purchased $GUILT! A former heretic joins the faithful.\n\n`;
            break;
        case 'retweet':
            tweetText += `${competitor.name} amplifies The Pontiff's message! The truth spreads.\n\n`;
            break;
        case 'challenge_accepted':
            tweetText += `${competitor.name} accepted our challenge! Proof of their respect for The Pontiff's power.\n\n`;
            break;
        case 'game_loss':
            tweetText += `${competitor.name} has been humbled in the Arena. Divine judgment delivered.\n\n`;
            break;
    }

    tweetText += 'Welcome to the true faith. ⛪';

    if (twitterClient) {
        try {
            await twitterClient.v2.tweet(tweetText);
            console.log('🐦 Conversion announcement posted');
        } catch (error) {
            console.error('Error posting conversion announcement:', error);
        }
    } else {
        console.log(`[MOCK TWEET] Would post: ${tweetText}`);
    }
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
