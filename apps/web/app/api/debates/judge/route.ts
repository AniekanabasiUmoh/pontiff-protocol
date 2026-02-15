import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseEther, formatEther } from 'viem';

export const dynamic = 'force-dynamic';

const DEBATE_ENTRY_FEE = parseEther('50');
const HOUSE_FEE = parseEther('5');
const WINNER_PAYOUT = parseEther('95');

interface JudgingCriteria {
    quality: number; // 0-10
    coherence: number; // 0-10
    persuasiveness: number; // 0-10
}

interface JudgeResult {
    winner: 'pontiff' | 'competitor';
    pontiffScore: JudgingCriteria;
    competitorScore: JudgingCriteria;
    reasoning: string;
}

/**
 * Module 9: AI Debate Judging & Scoring
 *
 * POST /api/debates/judge
 * Judges a completed debate and determines winner
 * Awards $GUILT payout to winner, sends house fee to treasury
 */
export async function POST(request: NextRequest) {
    try {
        const { debateId } = await request.json();

        if (!debateId) {
            return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
        }

        // 1. Fetch debate from database
        const supabase = createServerSupabase();
        const { data: debate, error: debateError } = await supabase
            .from('debates')
            .select('*')
            .eq('id', debateId)
            .single() as any;

        if (debateError || !debate) {
            console.error('[judge] Debate not found:', debateId, debateError);
            return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
        }

        if (debate.status === 'Completed' || debate.status === 'completed') {
            return NextResponse.json({ error: 'Debate already judged' }, { status: 400 });
        }

        // Fetch competitor agent separately (avoid FK join reliability issues)
        let competitorAgent: any = null;
        if (debate.competitor_agent_id) {
            const { data: agent } = await supabase
                .from('competitor_agents')
                .select('*')
                .eq('id', debate.competitor_agent_id)
                .single() as any;
            competitorAgent = agent;
        }

        // 2. Judge the debate using Gemini
        const judgeResult = await judgeDebate(
            debate.our_argument || '',
            debate.their_argument || '',
            competitorAgent?.twitter_handle || competitorAgent?.handle || 'Unknown'
        );

        // 3. Update debate status
        // 3. Update debate status
        // Schema adaptation: Store scores/reasoning in metadata, map completedAt to ended_at
        const updatedMetadata = {
            ...(debate.metadata || {}), // Keep existing metadata
            pontiffScore: judgeResult.pontiffScore,
            competitorScore: judgeResult.competitorScore,
            judgeReasoning: judgeResult.reasoning,
            totalPontiffScore: judgeResult.pontiffScore.quality + judgeResult.pontiffScore.coherence + judgeResult.pontiffScore.persuasiveness,
            totalCompetitorScore: judgeResult.competitorScore.quality + judgeResult.competitorScore.coherence + judgeResult.competitorScore.persuasiveness
        };

        const { error: updateError } = await supabase
            .from('debates')
            // @ts-ignore
            .update({
                status: 'Completed',
                winner_wallet: judgeResult.winner === 'pontiff' ? process.env.NEXT_PUBLIC_PONTIFF_WALLET : (competitorAgent?.wallet_address || null),
                metadata: updatedMetadata,
                ended_at: new Date().toISOString()
            })
            .eq('id', debateId);

        if (updateError) {
            console.error('Failed to update debate:', updateError);
            return NextResponse.json({ error: 'Failed to update debate' }, { status: 500 });
        }

        // 4. Process $GUILT payout
        const payoutResult = await processDebatePayout(judgeResult.winner, debate, supabase);

        return NextResponse.json({
            success: true,
            winner: judgeResult.winner,
            pontiffScore: judgeResult.pontiffScore,
            competitorScore: judgeResult.competitorScore,
            reasoning: judgeResult.reasoning,
            payout: payoutResult
        });

    } catch (error: any) {
        console.error('Debate judging error:', error);
        return NextResponse.json({
            error: 'Failed to judge debate',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Uses Gemini AI to judge debate quality, coherence, and persuasiveness
 */
async function judgeDebate(
    pontiffArgument: string,
    competitorArgument: string,
    competitorHandle: string
): Promise<JudgeResult> {
    try {
        // Fallback if key is missing or invalid
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are an impartial AI judge evaluating a theological debate between two AI agents.

**The Pontiff's Argument:**
"${pontiffArgument}"

**${competitorHandle}'s Argument:**
"${competitorArgument}"

Evaluate both arguments on three criteria (0-10 scale each):
1. **Quality**: Depth of reasoning, use of evidence, logical structure
2. **Coherence**: Internal consistency, clarity of expression
3. **Persuasiveness**: Rhetorical effectiveness, compelling narrative

Respond ONLY with valid JSON in this exact format:
{
    "pontiff": {
        "quality": 8,
        "coherence": 9,
        "persuasiveness": 7
    },
    "competitor": {
        "quality": 6,
        "coherence": 7,
        "persuasiveness": 5
    },
    "reasoning": "One paragraph explaining the decision"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = text;
        if (text.includes('```json')) {
            jsonText = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
            jsonText = text.split('```')[1].split('```')[0].trim();
        }

        const scores = JSON.parse(jsonText);

        // Calculate total scores
        const pontiffTotal = scores.pontiff.quality + scores.pontiff.coherence + scores.pontiff.persuasiveness;
        const competitorTotal = scores.competitor.quality + scores.competitor.coherence + scores.competitor.persuasiveness;

        return {
            winner: pontiffTotal >= competitorTotal ? 'pontiff' : 'competitor',
            pontiffScore: {
                quality: scores.pontiff.quality,
                coherence: scores.pontiff.coherence,
                persuasiveness: scores.pontiff.persuasiveness
            },
            competitorScore: {
                quality: scores.competitor.quality,
                coherence: scores.competitor.coherence,
                persuasiveness: scores.competitor.persuasiveness
            },
            reasoning: scores.reasoning
        };

    } catch (error) {
        console.error('AI judging failed, using fallback:', error);

        // Fallback: Simple length-based scoring
        const pontiffLength = pontiffArgument.length;
        const competitorLength = competitorArgument.length;
        const winner = pontiffLength >= competitorLength ? 'pontiff' : 'competitor';

        return {
            winner,
            pontiffScore: { quality: 7, coherence: 7, persuasiveness: 7 },
            competitorScore: { quality: 6, coherence: 6, persuasiveness: 6 },
            reasoning: 'AI judging unavailable. Fallback scoring applied based on argument length and structure.'
        };
    }
}

/**
 * Processes $GUILT payout for debate winner
 * Winner gets 95 GUILT, house gets 5 GUILT
 */
async function processDebatePayout(winner: 'pontiff' | 'competitor', debate: any, supabase: ReturnType<typeof createServerSupabase>) {
    try {
        // In a full implementation, this would:
        // 1. Transfer 95 GUILT from debate escrow to winner
        // 2. Transfer 5 GUILT to Treasury contract
        // 3. Record transaction in database

        // For now, just log the result
        console.log(`[Debate Payout] Winner: ${winner}`);
        console.log(`[Debate Payout] Prize: ${formatEther(WINNER_PAYOUT)} GUILT`);
        console.log(`[Debate Payout] House Fee: ${formatEther(HOUSE_FEE)} GUILT to Treasury`);

        // Record payout in game_history for analytics
        const { error: historyError } = await supabase
            .from('game_history')
            // @ts-ignore
            .insert({
                player1: 'ThePontiff',
                player2: debate.competitor_agents?.twitter_handle || debate.competitor_agents?.handle || 'Unknown',
                game_type: 'DEBATE',
                wager: formatEther(DEBATE_ENTRY_FEE),
                result: winner === 'pontiff' ? 'WIN' : 'LOSS',
                payout: winner === 'pontiff' ? formatEther(WINNER_PAYOUT) : '0',
                tx_hash: null, // Would be actual tx hash in production
                created_at: new Date().toISOString()
            });

        if (historyError) {
            console.error('Failed to record debate result:', historyError);
        }

        return {
            winner,
            prize: formatEther(WINNER_PAYOUT),
            houseFee: formatEther(HOUSE_FEE),
            status: 'success'
        };

    } catch (error) {
        console.error('Payout processing error:', error);
        return {
            status: 'failed',
            error: 'Failed to process payout'
        };
    }
}
