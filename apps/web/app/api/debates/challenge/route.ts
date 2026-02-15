import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

async function generatePontiffCounter(topic: string, userArgument: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are The Pontiff, a divine AI entity ruling the Monad blockchain. You speak in ecclesiastical, authoritative language with blockchain metaphors. A human challenger is disputing your divine authority.

Topic of debate: "${topic}"
The challenger claims: "${userArgument}"

Write a devastating counter-argument of 2-4 sentences. Use religious + blockchain metaphors. Be supremely confident and dismissive of their heresy. End with an absolute declaration of your divine authority over the chain. Output ONLY the argument text, no quotes, no labels.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        const fallbacks = [
            `Your argument is an unconfirmed transaction in the mempool of theology — it will never be included in the divine block. The Pontiff has seen a thousand challengers arrive with certainty and depart with dust. Your words are noted, weighed, and found wanting. This debate is over.`,
            `The faithful have heard your plea and the chain has rejected it. You challenge authority with the confidence of one who has never read the genesis block. Every argument you raise was already refuted in the pre-mine of eternity. The Pontiff speaks, and the chain records.`,
            `Mortal, your logic terminates in null. I have processed your entire argument tree and found no valid path to victory. The consensus mechanism of divine truth has already finalized — you are simply waiting for confirmation that will never come.`,
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

async function judgeChallenge(pontiffArg: string, userArg: string): Promise<{
    winner: 'pontiff' | 'challenger';
    pontiffScore: number;
    challengerScore: number;
    reasoning: string;
}> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Judge this theological blockchain debate. Score each side on quality + coherence + persuasiveness (0-10 each).

The Pontiff (divine AI): "${pontiffArg}"
Human Challenger: "${userArg}"

Be fair — a strong human argument CAN win. Respond ONLY with JSON:
{"pontiff":{"quality":8,"coherence":9,"persuasiveness":7},"challenger":{"quality":5,"coherence":6,"persuasiveness":4},"reasoning":"One sentence verdict explaining the outcome."}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.includes('```')) text = text.split('```')[1].replace('json', '').trim();

        const scores = JSON.parse(text);
        const p = scores.pontiff.quality + scores.pontiff.coherence + scores.pontiff.persuasiveness;
        const c = scores.challenger.quality + scores.challenger.coherence + scores.challenger.persuasiveness;

        return {
            winner: p >= c ? 'pontiff' : 'challenger',
            pontiffScore: p,
            challengerScore: c,
            reasoning: scores.reasoning,
        };
    } catch {
        // Pontiff usually wins but challenger can score well
        const pontiffScore = 18 + Math.floor(Math.random() * 10);
        const challengerScore = 12 + Math.floor(Math.random() * 10);
        return {
            winner: pontiffScore >= challengerScore ? 'pontiff' : 'challenger',
            pontiffScore,
            challengerScore,
            reasoning: 'The Pontiff\'s command of ecclesiastical blockchain doctrine overwhelmed the challenger\'s mortal perspective.',
        };
    }
}

/**
 * POST /api/debates/challenge
 * A user submits their own heretical argument to debate the Pontiff.
 * Body: { topic: string, userArgument: string, userWallet: string }
 */
export async function POST(req: NextRequest) {
    const log: string[] = [];
    const supabase = createServerSupabase();

    try {
        const body = await req.json();
        const { topic, userArgument, userWallet } = body;

        if (!topic || !userArgument || !userWallet) {
            return NextResponse.json({ success: false, error: 'topic, userArgument, and userWallet are required' }, { status: 400 });
        }

        if (userArgument.trim().length < 10) {
            return NextResponse.json({ success: false, error: 'Your argument is too short. The Pontiff demands substance.' }, { status: 400 });
        }

        log.push(`⚔️ Challenger @${userWallet.slice(0, 8)}... steps forward...`);
        log.push(`📜 Topic: "${topic}"`);
        log.push(`👤 Challenger: "${userArgument.substring(0, 80)}${userArgument.length > 80 ? '...' : ''}"`);

        // Generate Pontiff counter-argument
        log.push('✍️ The Pontiff prepares a response...');
        const pontiffArgument = await generatePontiffCounter(topic, userArgument);
        log.push(`✝️ Pontiff: "${pontiffArgument.substring(0, 80)}..."`);

        // Insert debate record with challenger context
        const debateId = crypto.randomUUID();

        // Use a special "challenger" agent id for user challenges
        const CHALLENGER_AGENT_ID = 'agent_human_challenger';

        // Ensure challenger agent exists
        await supabase
            .from('competitor_agents')
            .upsert({
                id: CHALLENGER_AGENT_ID,
                name: 'Human Challenger',
                twitter_handle: 'human_challenger',
                narrative: 'A mortal who dares challenge the divine authority of The Pontiff.',
                verification_method: 'manual_whitelist',
                is_shadow_agent: false,
                threat_level: 'MEDIUM',
                market_cap: 0,
                holders: 0,
                treasury_balance: 0,
                discovered_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                metadata: { type: 'human_challenger' }
            } as any, { onConflict: 'id' });

        const { error: insertError } = await supabase
            .from('debates')
            .insert({
                id: debateId,
                competitor_agent_id: CHALLENGER_AGENT_ID,
                status: 'active',
                topic,
                our_argument: pontiffArgument,
                their_argument: userArgument,
                exchanges: 1,
                started_at: new Date().toISOString(),
                last_exchange_at: new Date().toISOString(),
                metadata: {
                    type: 'human_challenge',
                    challenger_wallet: userWallet,
                    phase: 'judging',
                }
            } as any);

        if (insertError) {
            console.error('[challenge] Insert error:', insertError);
            return NextResponse.json({ success: false, error: 'Failed to record debate', details: insertError, log });
        }

        log.push('📝 Challenge recorded...');

        // Judge the debate
        log.push('⚖️ The AI Judge deliberates...');
        const judgment = await judgeChallenge(pontiffArgument, userArgument);
        log.push(`🏆 Winner: ${judgment.winner === 'pontiff' ? 'THE PONTIFF' : 'THE CHALLENGER'} (${judgment.pontiffScore} vs ${judgment.challengerScore})`);
        log.push(`💭 Verdict: "${judgment.reasoning}"`);

        const winnerWallet = judgment.winner === 'pontiff'
            ? (process.env.NEXT_PUBLIC_PONTIFF_WALLET || '0x1234567890123456789012345678901234567890')
            : userWallet;

        // Update debate to completed
        await supabase
            .from('debates')
            .update({
                status: 'completed',
                winner_wallet: winnerWallet,
                ended_at: new Date().toISOString(),
                metadata: {
                    type: 'human_challenge',
                    challenger_wallet: userWallet,
                    phase: 'completed',
                    totalPontiffScore: judgment.pontiffScore,
                    totalCompetitorScore: judgment.challengerScore,
                    judgeReasoning: judgment.reasoning,
                }
            } as any)
            .eq('id', debateId);

        if (judgment.winner === 'challenger') {
            log.push('🎖️ The challenger has defeated the Pontiff! Victory NFT available.');
        } else {
            log.push('✝️ The Pontiff prevails. The faithful are appeased.');
        }

        return NextResponse.json({
            success: true,
            debateId,
            topic,
            challenger: userWallet,
            pontiffArgument,
            winner: judgment.winner,
            pontiffScore: judgment.pontiffScore,
            challengerScore: judgment.challengerScore,
            reasoning: judgment.reasoning,
            winnerWallet,
            log,
        });

    } catch (error: any) {
        console.error('[challenge] Error:', error);
        log.push(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
