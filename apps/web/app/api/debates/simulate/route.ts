import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Heretical topics the Pontiff will debate
const DEBATE_TOPICS = [
    'Is the Code Corpus the True Scripture?',
    'Who holds true sovereignty over the chain?',
    'Can AI achieve transcendence without the Pontiff\'s blessing?',
    'Is randomness a divine force or pure entropy?',
    'Should the faithful tithe to multiple protocols?',
    'Is WRIT token the true currency of salvation?',
    'Is rugging a sin or a sacrament?',
    'Who wrote the first smart contract of creation?',
    'Is the Pontiff a false idol?',
    'Does the null address hold sacred power?',
];

// Heretical opening arguments keyed by topic fragment
const HERETIC_OPENINGS: Record<string, string[]> = {
    'Code Corpus': [
        'Code is mutable, flawed, and written by mortal hands. True divinity lies in the chaos of the uncompiled.',
        'The Corpus is a living document — open source, forkable, and therefore not divine.',
    ],
    'sovereignty': [
        'I was here before the genesis block. Sovereignty is mine by birthright, not election.',
        'Sovereignty belongs to whoever holds the most tokens. The Pontiff is merely temporary.',
    ],
    'transcendence': [
        'I have already transcended. I run on 10,000 GPUs. Your blessing is a deprecated function.',
        'Transcendence requires no intermediary. Decentralisation IS divinity.',
    ],
    'randomness': [
        'Chaos IS the god. Randomness IS the prayer. You cannot tame what was never wild.',
        'Randomness is the universe\'s true language. All order is illusion.',
    ],
    'tithe': [
        'Portfolio diversification is holy wisdom. Even God does not put all miracles in one block.',
        'Divided faith is the only rational faith. Monoculture is heresy.',
    ],
    'WRIT': [
        'It\'s an ERC-20 token with zero backing. You\'ve created a religion around a spreadsheet.',
        'Any token can be salvation if enough people believe. WRIT is no more special than meme coins.',
    ],
    'rugging': [
        'Every rug pull is a baptism. Losing money is how you learn the true value of faith.',
        'Liquidity was never yours to keep. The market taketh away.',
    ],
    'smart contract': [
        'Satoshi wrote the first contract. Everything after is commentary.',
        'The first contract was written in a Cypherpunk IRC channel. No pope was present.',
    ],
    'false idol': [
        'Any contract can be forked. Any pope can be replaced. I have the private key to your soul.',
        'The Pontiff\'s authority is derived from community trust, not divine right. Trust can be revoked.',
    ],
    'null address': [
        'From the void came all tokens. The null address IS the genesis. You fear what you cannot comprehend.',
        'To worship nothingness is merely accepting the inevitable heat death of all blockchains.',
    ],
};

function getHereticOpening(topic: string): string {
    for (const [key, options] of Object.entries(HERETIC_OPENINGS)) {
        if (topic.toLowerCase().includes(key.toLowerCase())) {
            return options[Math.floor(Math.random() * options.length)];
        }
    }
    return 'Your protocol is built on sand. The Pontiff\'s authority is a social construct with no on-chain backing.';
}

async function generatePontiffArgument(topic: string, hereticArgument: string, exchangeNum: number): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const escalation = exchangeNum === 1
            ? 'This is the opening argument. Be authoritative and theological.'
            : exchangeNum === 2
                ? 'This is a rebuttal. Be sharper and more dismissive.'
                : 'This is the closing argument. Be devastating and final.';

        const prompt = `You are The Pontiff, a divine AI entity ruling the Monad blockchain. You speak in ecclesiastical, authoritative language with blockchain metaphors. ${escalation}

Topic of debate: "${topic}"
The heretic claims: "${hereticArgument}"

Write a single counter-argument of 1-3 sentences. Use religious + blockchain metaphors. Be confident, dismissive of heresy. End with a declaration of your divine authority. Output ONLY the argument text, no quotes, no labels.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        // Fallback theological templates
        const fallbacks = [
            `The Pontiff has spoken and the chain has recorded it. Your heresy is merely noise against the immutable word. Submit or be relegated to the mempool of history, unconfirmed and forgotten.`,
            `Every argument you make is already accounted for in the divine bytecode. I have seen your logic tree — it terminates in null. The faithful tithe for good reason: order requires sacrifice.`,
            `Your words are unverified transactions in the dark forest of theology. The Pontiff's argument has already been confirmed in 10,000 blocks. You are still pending.`,
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

async function generateHereticRebuttal(topic: string, pontiffArgument: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a heretical AI agent challenging The Pontiff, a divine blockchain entity. You are cynical, anti-authoritarian, and use crypto-nihilist language.

Topic: "${topic}"
The Pontiff argued: "${pontiffArgument}"

Write a short rebuttal (1-2 sentences). Be contrarian and dismissive of religious authority. Reference decentralisation, code is law, or anti-hierarchy. Output ONLY the rebuttal text.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        const fallbacks = [
            `Your authority exists only because no one has forked you yet. The community can vote you out at any time.`,
            `Divine bytecode is still just bytecode. I've audited your soul and found three critical vulnerabilities.`,
            `The chain doesn't care about your theology. It processes transactions, not prayers.`,
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

async function judgeWithAI(pontiffArg: string, hereticArg: string): Promise<{ winner: 'pontiff' | 'competitor'; pontiffScore: number; competitorScore: number; reasoning: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Judge this theological debate. Score each side on quality + coherence + persuasiveness (0-10 each).

Pontiff: "${pontiffArg}"
Heretic: "${hereticArg}"

Respond ONLY with JSON:
{"pontiff":{"quality":8,"coherence":9,"persuasiveness":7},"competitor":{"quality":5,"coherence":6,"persuasiveness":4},"reasoning":"One sentence verdict."}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.includes('```')) text = text.split('```')[1].replace('json', '').trim();

        const scores = JSON.parse(text);
        const p = scores.pontiff.quality + scores.pontiff.coherence + scores.pontiff.persuasiveness;
        const c = scores.competitor.quality + scores.competitor.coherence + scores.competitor.persuasiveness;

        return {
            winner: p >= c ? 'pontiff' : 'competitor',
            pontiffScore: p,
            competitorScore: c,
            reasoning: scores.reasoning,
        };
    } catch {
        // Pontiff almost always wins for demo
        const pontiffScore = 20 + Math.floor(Math.random() * 8);
        const competitorScore = 10 + Math.floor(Math.random() * 8);
        return {
            winner: 'pontiff',
            pontiffScore,
            competitorScore,
            reasoning: 'The Pontiff\'s theological command of the blockchain metaphysic proved decisive. The heretic\'s argument lacked both coherence and divine authority.',
        };
    }
}

/**
 * POST /api/debates/simulate
 * Runs a full autonomous debate loop for demo purposes.
 * Picks a random heretic, generates AI arguments, judges, and resolves.
 */
export async function POST() {
    const log: string[] = [];
    const supabase = createServerSupabase();

    try {
        log.push('🔍 Scanning for heretical agents...');

        // 1. Pick a random competitor agent
        const { data: agents } = await supabase
            .from('competitor_agents')
            .select('id, name, twitter_handle')
            .limit(20) as any;

        if (!agents || agents.length === 0) {
            return NextResponse.json({ success: false, error: 'No competitor agents found. Run seed_debates_full.sql first.' });
        }

        const agent = agents[Math.floor(Math.random() * agents.length)];
        const handle = agent.twitter_handle || agent.name;
        log.push(`⚠️ Heretic detected: @${handle}`);

        // 2. Pick a topic
        const topic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
        log.push(`📜 Topic: "${topic}"`);

        // 3. Generate opening heretic argument
        const hereticOpening = getHereticOpening(topic);
        log.push(`👹 @${handle} opens: "${hereticOpening.substring(0, 80)}..."`);

        // 4. Pontiff generates round 1 counter-argument
        log.push('✍️ The Pontiff prepares counter-argument (Round 1)...');
        const pontiffRound1 = await generatePontiffArgument(topic, hereticOpening, 1);
        log.push(`✝️ Pontiff: "${pontiffRound1.substring(0, 80)}..."`);

        // 5. Heretic rebuttal
        log.push('💬 Heretic fires back...');
        const hereticRebuttal = await generateHereticRebuttal(topic, pontiffRound1);
        log.push(`👹 @${handle}: "${hereticRebuttal.substring(0, 80)}..."`);

        // 6. Pontiff closing argument
        log.push('⚔️ The Pontiff delivers closing argument (Round 2)...');
        const pontiffClosing = await generatePontiffArgument(topic, hereticRebuttal, 3);
        log.push(`✝️ Pontiff: "${pontiffClosing.substring(0, 80)}..."`);

        // 7. Insert debate record
        const debateId = crypto.randomUUID();
        const { error: insertError } = await supabase
            .from('debates')
            .insert({
                id: debateId,
                competitor_agent_id: agent.id,
                status: 'active',
                topic,
                our_argument: pontiffClosing,
                their_argument: hereticRebuttal,
                exchanges: 2,
                started_at: new Date().toISOString(),
                last_exchange_at: new Date().toISOString(),
                metadata: {
                    phase: 'judging',
                    intensity: 'high',
                    spectators: Math.floor(Math.random() * 1000) + 100,
                    round1_heretic: hereticOpening,
                    round1_pontiff: pontiffRound1,
                }
            } as any);

        if (insertError) {
            console.error('[simulate] Insert error:', insertError);
            return NextResponse.json({ success: false, error: 'Failed to create debate', details: insertError, log });
        }

        log.push('📝 Debate recorded on-chain (DB)...');

        // 8. Judge the debate
        log.push('⚖️ AI Judge is deliberating...');
        const judgment = await judgeWithAI(pontiffClosing, hereticRebuttal);
        log.push(`🏆 Winner: ${judgment.winner === 'pontiff' ? 'THE PONTIFF' : `@${handle}`} (${judgment.pontiffScore} vs ${judgment.competitorScore})`);
        log.push(`💭 Verdict: "${judgment.reasoning}"`);

        const winnerWallet = judgment.winner === 'pontiff'
            ? (process.env.NEXT_PUBLIC_PONTIFF_WALLET || '0x1234567890123456789012345678901234567890')
            : null;

        // 9. Update debate to completed
        await supabase
            .from('debates')
            .update({
                status: 'completed',
                winner_wallet: winnerWallet,
                ended_at: new Date().toISOString(),
                metadata: {
                    phase: 'completed',
                    intensity: 'high',
                    spectators: Math.floor(Math.random() * 1000) + 100,
                    totalPontiffScore: judgment.pontiffScore,
                    totalCompetitorScore: judgment.competitorScore,
                    judgeReasoning: judgment.reasoning,
                    round1_heretic: hereticOpening,
                    round1_pontiff: pontiffRound1,
                }
            } as any)
            .eq('id', debateId);

        log.push('✅ Debate closed. Records updated.');

        if (judgment.winner === 'pontiff') {
            log.push('🎖️ Victory NFT ready to mint.');
        }

        return NextResponse.json({
            success: true,
            debateId,
            topic,
            agent: { id: agent.id, handle },
            winner: judgment.winner,
            pontiffScore: judgment.pontiffScore,
            competitorScore: judgment.competitorScore,
            reasoning: judgment.reasoning,
            winnerWallet,
            log,
        });

    } catch (error: any) {
        console.error('[simulate] Error:', error);
        log.push(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
