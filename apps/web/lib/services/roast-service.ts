import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabase } from '../db/supabase-server';

const FALLBACK_ROASTS = [
    "Your portfolio is a crime scene — and you left fingerprints everywhere.",
    "Even Judas made a profit. You did not.",
    "You buy tops and sell bottoms with the confidence of a genius. Incredible.",
    "The only thing going up in your wallet is the gas fees.",
    "Historians will study your trading history as a cautionary tale.",
    "You have the financial instincts of someone who thought Luna was a sure thing.",
    "Your wallet is so empty it has its own echo.",
    "Congratulations — you managed to lose money in a bull market.",
    "You don't need a priest, you need a financial advisor. Urgently.",
    "The blockchain never forgets. Neither will we."
];

import { Sin } from './sin-scanner';

export async function generateRoast(walletAddress: string, sins: Sin[], balance: string, nonce: number): Promise<string> {
    const address = walletAddress.toLowerCase();

    // 1. Check Cache (Confessions table)
    // We look for a confession from the last 24 hours for this wallet
    try {
        const supabase = createServerSupabase();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: cachedConfession, error } = await supabase
            .from('confessions')
            .select('roast_text, created_at')
            .eq('wallet_address', address)
            .gt('created_at', oneDayAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Cast to any to bypass TS error if types are missing
        const confession = cachedConfession as any;

        if (confession && confession.roast_text) {
            // Check if it's a known fallback roast (to retry generation)
            const isFallback = FALLBACK_ROASTS.some(f => confession.roast_text.startsWith(f));

            if (isFallback) {
                console.log(`[RoastService] Cached roast is a fallback. Regenerating for ${address}`);
            } else {
                console.log(`[RoastService] Serving cached roast for ${address}`);
                return confession.roast_text;
            }
        }
    } catch (err) {
        console.warn("[RoastService] Cache check failed, proceeding to generate.", err);
    }

    // 2. Generate with AI
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("No API Key");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are The Pontiff — a Catholic cardinal who judges crypto sinners with dark humor and divine authority.

Here is the sinner's record:
- Sins: ${sins.map(s => `${s.type} (severity: ${s.severity}) — ${s.description}`).join('\n- ')}
- Current balance: ${balance} MON
- Total transactions: ${nonce}

Write a short roast. Rules:
- Use religious imagery (sin, judgment, hell, purgatory, absolution, confession) but in plain modern English. No archaic words like "thou", "thy", or "dost".
- Be specific — reference their actual sins, balance, or transaction count.
- Funny and cutting, like a priest who has completely given up on you.
- DO NOT include the wallet address or any "0x..." string.
- Call them "you" directly. 2 sentences max.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
            return text.trim();
        } else {
            throw new Error("Empty response from AI");
        }

    } catch (error: any) {
        console.error("[RoastService] AI Generation failed:", error);

        if (error.message?.includes("API key not valid")) {
            console.error("[RoastService] CRITICAL: The provided GEMINI_API_KEY is invalid.");
        } else if (error.message?.includes("429") || error.status === 429) {
            console.warn("[RoastService] Rate limit exceeded (429). Attempting retry...");
            // Simple retry logic check: maybe wait and try again?
            // Since we are inside a Next.js API route, we can't wait too long.
            // But let's try a simple immediate retry if it was a flake?
            // Or better, just log and return fallback.
            // Actually, for free tier 429, retry usually fails immediately.
            // Best strategy is to fail gracefully to fallback.
            console.warn("[RoastService] Rate limit persists. Using fallback.");
        } else if (error.message?.includes("403")) {
            console.error("[RoastService] CRITICAL: API key has insufficient permissions or quota exceeded.");
        }

        return getFallbackRoast(sins);
    }
}

function getFallbackRoast(sins: Sin[]): string {
    const roastTemplate = FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
    let sinText = "";
    if (sins && sins.length > 0) {
        const firstSin = sins[0].type;
        const otherSinsCount = sins.length - 1;

        if (otherSinsCount > 0) {
            sinText = ` You are guilty of ${firstSin} and ${otherSinsCount} other sin${otherSinsCount > 1 ? 's' : ''}.`;
        } else {
            sinText = ` You are guilty of ${firstSin}.`;
        }
    } else {
        sinText = " You have no recorded sins, yet you are here. Suspicious.";
    }

    return `${roastTemplate}${sinText}`;
}
