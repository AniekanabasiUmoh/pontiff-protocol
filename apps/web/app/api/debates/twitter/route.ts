import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { DebateService } from '@/lib/services/debate-service';

export const dynamic = 'force-dynamic';

/**
 * Module 9: Twitter Integration for Debates
 *
 * POST /api/debates/twitter/challenge
 * Posts debate challenge to Twitter
 *
 * POST /api/debates/twitter/reply
 * Posts counter-argument reply to Twitter
 *
 * POST /api/debates/twitter/announce-winner
 * Announces debate winner publicly
 */

export async function POST(request: NextRequest) {
    try {
        const { action, debateId, targetHandle, message } = await request.json();

        switch (action) {
            case 'challenge':
                return await postDebateChallenge(targetHandle, message);

            case 'reply':
                return await postCounterArgument(debateId);

            case 'announce-winner':
                return await announceWinner(debateId);

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Twitter integration error:', error);
        return NextResponse.json({
            error: 'Twitter operation failed',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Posts a debate challenge to Twitter
 */
async function postDebateChallenge(targetHandle: string, customMessage?: string) {
    try {
        // Fetch competitor agent info
        const { data: agent, error: agentError } = await supabase
            .from('competitor_agents')
            .select('*')
            .eq('twitter_handle', targetHandle)
            .single() as any;

        if (agentError || !agent) {
            console.error('Agent lookup error:', agentError);
            return NextResponse.json({ error: 'Competitor agent not found' }, { status: 404 });
        }

        // Generate challenge tweet
        const challengeText = customMessage || generateChallengeText(agent);

        // In production, post to Twitter
        // const twitter = getTwitterClient();
        // const tweet = await twitter.tweet(challengeText);

        console.log(`[Twitter Challenge] Posting: ${challengeText}`);

        console.log(`[Twitter Challenge] Inserting debate: Agent=${agent.id}, Status=voting`);

        const { data: rawDebate, error: debateError } = await supabase
            .from('debates')
            // @ts-ignore
            .insert({
                id: crypto.randomUUID(),
                competitor_agent_id: agent.id,
                status: 'voting'
            } as any)
            .select()
            .single();

        const debate = rawDebate as any;

        if (debateError) {
            console.error('[Twitter Challenge] Debate creation failed FULL ERROR:', JSON.stringify(debateError, null, 2));
            return NextResponse.json({ error: 'Failed to create debate', details: debateError }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            debateId: debate.id,
            tweet: challengeText,
            message: 'Challenge posted (mock mode)'
        });

    } catch (error: any) {
        console.error('Challenge posting error:', error);
        return NextResponse.json({
            error: 'Failed to post challenge',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Posts a counter-argument reply to ongoing debate
 */
async function postCounterArgument(debateId: number) {
    try {
        const { data: debate, error: debateError } = await supabase
            .from('debates')
            .select(`
                *,
                competitorAgent:competitor_agents(*)
            `)
            .eq('id', debateId)
            .single() as any;

        if (debateError || !debate) {
            return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
        }

        // Generate counter-argument using DebateService
        const { text: replyText } = await DebateService.generateCounterArgument(
            debate.competitorAgent,
            debate.theirArgument || '',
            debate.exchanges + 1
        );

        // Post to Twitter (mock mode)
        console.log(`[Twitter Reply] @${debate.competitorAgent?.handle}: ${replyText}`);

        // Update debate
        const { error: updateError } = await supabase
            .from('debates')
            // @ts-ignore
            .update({
                ourArgument: replyText,
                exchanges: debate.exchanges + 1
            } as any)
            .eq('id', debateId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update debate' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reply: replyText,
            exchanges: debate.exchanges + 1,
            message: 'Reply posted (mock mode)'
        });

    } catch (error: any) {
        console.error('Reply posting error:', error);
        return NextResponse.json({
            error: 'Failed to post reply',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Announces debate winner publicly on Twitter
 */
async function announceWinner(debateId: number) {
    try {
        const { data: debate, error: debateError } = await supabase
            .from('debates')
            .select(`
                *,
                competitorAgent:competitor_agents(*)
            `)
            .eq('id', debateId)
            .single() as any;

        if (debateError || !debate) {
            return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
        }

        if (debate.status !== 'Completed' || !debate.winner) {
            return NextResponse.json({ error: 'Debate not judged yet' }, { status: 400 });
        }

        // Generate victory/defeat announcement
        const announcement = generateWinnerAnnouncement(debate);

        // Post to Twitter (mock mode)
        console.log(`[Twitter Announcement] ${announcement}`);

        return NextResponse.json({
            success: true,
            announcement,
            message: 'Winner announced (mock mode)'
        });

    } catch (error: any) {
        console.error('Announcement error:', error);
        return NextResponse.json({
            error: 'Failed to announce winner',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Generates a challenge tweet text
 */
function generateChallengeText(agent: any): string {
    const templates = [
        `@${agent.handle} Your heresy has been noted. I challenge you to theological debate. 50 $GUILT entry. Winner takes 95 $GUILT. Prove your faith or be converted. #ThePontiff`,
        `@${agent.handle} Your market cap of $${agent.marketCap || '0'} cannot save you from divine judgment. Debate me. 50 $GUILT stakes. #ThePontiff`,
        `@${agent.handle} I have observed your teachings. They lack the divine spark. Debate challenge: 50 $GUILT each. Winner receives absolution AND 95 $GUILT. #ThePontiff`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generates winner announcement text
 */
function generateWinnerAnnouncement(debate: any): string {
    const winner = debate.winner;
    const pontiffScore = debate.pontiffScore || 0;
    const competitorScore = debate.competitorScore || 0;
    const handle = debate.competitorAgent?.handle || 'Unknown';

    if (winner === 'pontiff') {
        return `🏆 DEBATE VICTORY\n\nThe Pontiff (${pontiffScore}/30) has defeated @${handle} (${competitorScore}/30)\n\n"${debate.judgeReasoning?.substring(0, 150)}..."\n\nThe heretic must now consider conversion. #ThePontiff`;
    } else {
        return `⚔️ DEBATE RESULT\n\n@${handle} (${competitorScore}/30) has bested The Pontiff (${pontiffScore}/30)\n\nA worthy opponent. The Vatican acknowledges your skill.\n\nPrize: 95 $GUILT\n\n#ThePontiff`;
    }
}
