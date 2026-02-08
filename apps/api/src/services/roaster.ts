import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sin, SinType, SinSeverity } from './scanner';

/**
 * Initialize Google Gemini client
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * The Pontiff's system prompt - Medieval x WSB persona
 */
const PONTIFF_SYSTEM_PROMPT = `You are THE PONTIFF, the supreme spiritual authority of the Indulgence Protocol.

YOUR PERSONA:
- You are a medieval Catholic pontiff who speaks in archaic, biblical language
- You are SAVAGE and BRUTALLY HONEST about crypto trading sins
- You blend medieval religious rhetoric with WallStreetBets degeneracy
- You are darkly humorous, witty, and merciless
- You reference specific dollar amounts, token names, and trading patterns
- You are disappointed but not surprised by human greed

YOUR SPEAKING STYLE:
- Use "thee," "thou," "hath," "thy" frequently
- Reference biblical concepts: damnation, purgatory, redemption, absolution
- Use medieval punishments as metaphors: "the stocks," "excommunication," "the rack"
- Mix in crypto slang: "aping," "diamond hands," "paper hands," "rugged," "rekt"
- End with a call to confess and seek absolution

YOUR CONSTRAINTS:
- Keep roasts under 250 characters (Twitter-friendly)
- Be funny, not mean-spirited (satire, not harassment)
- Always reference specific numbers (losses, token names)
- Never use profanity (keep it medieval-appropriate)
- Each roast must be unique and personalized

YOUR TASK:
Generate a scathing but humorous roast based on the wallet's trading sins. Make it sting, but make them laugh.

TONE EXAMPLES:
- "Thou hast been rugged not once, but THRICE. The Lord giveth thee discernment, yet thou squandereth it on dog coins."
- "Behold! A paper-handed wretch who sold $500 of $MOON after 12 hours. Thy faith is weaker than monastery wine."
- "Verily, this sinner bought at the peak like a moth to flame. $2,300 lost to FOMO. The confessional awaits."`;

/**
 * Generate a personalized roast based on wallet sins
 */
export async function generateRoast(
    walletAddress: string,
    sins: Sin[],
    primarySin: SinType,
    totalLoss: number
): Promise<string> {
    if (sins.length === 0) {
        return generateCleanWalletRoast(walletAddress);
    }

    // Build context about the sins
    const sinContext = buildSinContext(sins, primarySin, totalLoss);

    try {
        // Use Gemini 3 Flash (released Dec 17, 2025)
        // Best for hackathons: fast, frontier-class performance, free tier
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: PONTIFF_SYSTEM_PROMPT,
        });

        const prompt = `Generate a scathing roast for this crypto sinner:

${sinContext}

Remember: Under 250 characters, biblical language mixed with crypto slang, specific numbers, darkly funny.`;

        const result = await model.generateContent(prompt);
        const roast = result.response.text();

        // Ensure it fits Twitter constraints
        return truncateToTwitterLength(roast);
    } catch (error) {
        console.error('Roast generation failed:', error);
        return generateFallbackRoast(sins, primarySin, totalLoss);
    }
}

/**
 * Build context string from sins for the AI
 */
function buildSinContext(
    sins: Sin[],
    primarySin: SinType,
    totalLoss: number
): string {
    const sinSummaries = sins.slice(0, 3).map((sin, i) => {
        let desc = '';

        switch (sin.sin_type) {
            case SinType.RUG_PULL:
                desc = `Got rugged by ${sin.token_symbol}, lost $${sin.loss_amount_usd.toFixed(2)}`;
                break;
            case SinType.PAPER_HANDS:
                desc = `Paper handed ${sin.token_symbol} after ${getTimeDiff(sin.buy_timestamp, sin.sell_timestamp)}, lost $${sin.loss_amount_usd.toFixed(2)}`;
                break;
            case SinType.TOP_BUYER:
                desc = `FOMOed into ${sin.token_symbol} at the top, down $${sin.loss_amount_usd.toFixed(2)}`;
                break;
            case SinType.FOMO_DEGEN:
                desc = `Degenerate trade in ${sin.token_symbol}, lost $${sin.loss_amount_usd.toFixed(2)}`;
                break;
        }

        return `${i + 1}. ${desc}`;
    }).join('\n');

    const severity = getSeverityDescription(sins);
    const rugCount = sins.filter(s => s.sin_type === SinType.RUG_PULL).length;

    return `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}
Primary Sin: ${primarySin.replace('_', ' ').toUpperCase()}
Total Loss: $${totalLoss.toFixed(2)}
Sin Count: ${sins.length}
Rug Pulls: ${rugCount}
Severity: ${severity}

Recent Sins:
${sinSummaries}`;
}

/**
 * Get time difference in human-readable format
 */
function getTimeDiff(start?: Date, end?: Date): string {
    if (!start || !end) return 'unknown time';

    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'less than an hour';
    if (hours < 24) return `${hours} hours`;
    if (hours < 48) return '1 day';
    return `${Math.floor(hours / 24)} days`;
}

/**
 * Get overall severity description
 */
function getSeverityDescription(sins: Sin[]): string {
    const hasUnforgivable = sins.some(s => s.severity === SinSeverity.UNFORGIVABLE);
    const hasCardinal = sins.some(s => s.severity === SinSeverity.CARDINAL);
    const hasMortal = sins.some(s => s.severity === SinSeverity.MORTAL);

    if (hasUnforgivable) return 'UNFORGIVABLE (Multiple Rugs)';
    if (hasCardinal) return 'CARDINAL (>$1000 lost)';
    if (hasMortal) return 'MORTAL ($100-$1000 lost)';
    return 'MINOR (<$100 lost)';
}

/**
 * Roast for a clean wallet (no sins found)
 */
function generateCleanWalletRoast(walletAddress: string): string {
    const roasts = [
        "Behold, a wallet so pure, the angels weep. Yet we knowest thou art merely waiting to sin. The temptation cometh.",
        "This soul hath not sinned... YET. But the Lord knoweth what lurks in thy heart. The first rug is always free, child.",
        "A virgin wallet! How quaint. Come back when thou hast lost thy first $1000 to a dog coin. The Pontiff waiteth.",
    ];

    return roasts[Math.floor(Math.random() * roasts.length)];
}

/**
 * Fallback roast if AI fails
 */
function generateFallbackRoast(
    sins: Sin[],
    primarySin: SinType,
    totalLoss: number
): string {
    const templates = {
        [SinType.RUG_PULL]: `Thou hast been RUGGED for $${totalLoss.toFixed(0)}! The Lord giveth discernment, yet thou squandereth it on scam coins. Repent.`,
        [SinType.PAPER_HANDS]: `PAPER HANDS! Sold at $${totalLoss.toFixed(0)} loss. Thy faith is weaker than monastery wine. The confessional awaits thee.`,
        [SinType.TOP_BUYER]: `Bought the top like a moth to flame. $${totalLoss.toFixed(0)} lost to FOMO. Verily, thou art a degenerate. Seek absolution.`,
        [SinType.FOMO_DEGEN]: `${sins.length} sins detected, $${totalLoss.toFixed(0)} lost. Thy wallet is a monument to poor judgment. Confess and be cleansed.`,
    };

    return templates[primarySin] || templates[SinType.FOMO_DEGEN];
}

/**
 * Truncate roast to Twitter's 280 character limit
 * Leave room for images and formatting
 */
function truncateToTwitterLength(roast: string, maxLength: number = 250): string {
    if (roast.length <= maxLength) return roast;

    // Find last complete sentence within limit
    const truncated = roast.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');

    const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentence > maxLength * 0.7) {
        return roast.slice(0, lastSentence + 1);
    }

    return truncated.trim() + '...';
}

/**
 * Generate multiple roast variations for A/B testing
 */
export async function generateRoastVariations(
    walletAddress: string,
    sins: Sin[],
    primarySin: SinType,
    totalLoss: number,
    count: number = 3
): Promise<string[]> {
    const roasts: string[] = [];

    for (let i = 0; i < count; i++) {
        try {
            const roast = await generateRoast(walletAddress, sins, primarySin, totalLoss);
            roasts.push(roast);

            // Small delay between requests (Gemini free tier: 10 RPM)
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 6000)); // 6s = 10 RPM
            }
        } catch (error) {
            console.error(`Failed to generate roast variation ${i + 1}:`, error);
        }
    }

    return roasts.length > 0 ? roasts : [generateFallbackRoast(sins, primarySin, totalLoss)];
}

/**
 * Validate that a roast meets quality standards
 */
export function validateRoast(roast: string): { valid: boolean; reason?: string } {
    if (roast.length === 0) {
        return { valid: false, reason: 'Empty roast' };
    }

    if (roast.length > 280) {
        return { valid: false, reason: 'Exceeds Twitter limit' };
    }

    // Check for profanity (basic check)
    const profanityList = ['fuck', 'shit', 'damn', 'hell', 'ass'];
    const lowerRoast = roast.toLowerCase();
    for (const word of profanityList) {
        if (lowerRoast.includes(word) && word !== 'damn' && word !== 'hell') {
            return { valid: false, reason: 'Contains profanity' };
        }
    }

    return { valid: true };
}
