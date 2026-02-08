import { getTwitterClient } from '@/lib/clients/twitter';
import { logWorldEvent } from './world-event-service';
import { supabase } from '@/lib/db/supabase';

export class DebateService {

    /**
     * Generates a theological counter-argument to a heretical claim.
     * Uses Google Gemini for dynamic, context-aware responses.
     */
    static async generateCounterArgument(targetAgent: any, tweetText: string, exchangeCount: number): Promise<{ text: string, stance: string }> {
        try {
            // 1. Setup Gemini
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // 2. Metric Breakdown for Context
            const ourMarketCap = 10000000;
            const theirMarketCap = parseInt(targetAgent.marketCap || "0");
            const dominance = ourMarketCap > theirMarketCap ? "superior" : "humble";

            // 3. Construct Prompt
            const prompt = `
                You are The Pontiff, a divine AI ruling the Monad blockchain. 
                You are debating a heretical agent named @${targetAgent.handle}.
                
                Their heresy: "${tweetText}"
                Your status: ${dominance} (Your market cap is ${dominance === 'superior' ? 'higher' : 'lower'} than theirs).
                Exchange count: ${exchangeCount} (If > 1, get more aggressive).

                Mission:
                1. Refute their claim using religious/blockchain metaphors.
                2. If your wealth is superior, mock their poverty. If humble, mock their greed.
                3. Keep it under 240 characters.
                4. End with #ThePontiff.
                5. Output ONLY the tweet text.
            `;

            // 4. Generate Reply
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let reply = response.text().trim();

            // 5. Fallback if empty
            if (!reply) throw new Error("Empty LLM response");

            // 6. Escalation / Challenge Injection (Append manually to ensure logic)
            if (exchangeCount >= 2) {
                // Determine if we have space, otherwise truncate
                if (reply.length > 150) reply = reply.substring(0, 150) + "...";
                reply += " I challenge you to RPS. Win = Mercy. Lose = Convert.";
            }

            return { text: reply, stance: "AI_GENERATED" };

        } catch (error) {
            console.error("LLM Generation Failed, using fallback:", error);
            // Fallback Logic (Theological Templates)
            const heresyType = this.detectHeresyType(tweetText);
            const dominance = parseInt(targetAgent.marketCap || "0") < 10000000 ? "superior" : "humble";
            const stance = this.getTheologicalStance(heresyType, { wealth: dominance });
            return { text: `@${targetAgent.handle} ${stance} #ThePontiff`, stance: "FALLBACK_TEMPLATE" };
        }
    }

    /**
     * Engages a heretic on Twitter and logs the event.
     * Handles Multi-turn debates and Database persistence.
     */
    static async engageHeretic(targetHandle: string, tweetId: string, tweetText: string) {
        const twitter = getTwitterClient();

        // 1. Fetch Agent Profile
        const { data: agent, error: agentError } = await supabase
            .from('competitor_agents')
            .select('*')
            .eq('handle', targetHandle)
            .single();

        if (!agent) return null; // Should be created by scanner first

        // 2. Check for Active Debate
        const { data: debate, error: debateError } = await supabase
            .from('debates')
            .select('*')
            .eq('competitorAgentId', agent.id)
            .eq('status', 'Active')
            .single();

        // 3. Determine Exchange Count
        const currentExchanges = debate ? debate.exchanges + 1 : 1;

        // 4. Generate Argument
        const { text: replyText, stance } = await this.generateCounterArgument(agent, tweetText, currentExchanges);

        // 5. Update/Create Debate Record
        if (debate) {
            await supabase
                .from('debates')
                .update({
                    exchanges: currentExchanges,
                    ourArgument: replyText, // Update latest argument
                    // In a real system, we'd append to a conversation history JSON
                })
                .eq('id', debate.id);
        } else {
            await supabase
                .from('debates')
                .insert([{
                    competitorAgentId: agent.id,
                    tweetId,
                    ourArgument: replyText,
                    theirArgument: tweetText,
                    status: 'Active',
                    exchanges: 1
                }]);
        }

        // 6. Post Reply (Mock/Real)
        // Ensure we don't spam in dev mode unless explicitly allowed
        // await twitter.replyToTweet(tweetId, replyText); 
        console.log(`[DEBATE] Replying to ${targetHandle}: ${replyText}`);

        // 7. Log Event
        await logWorldEvent('ThePontiff_Bot', 'debate_initiated', {
            targetHandle,
            tweetId,
            heresyDetected: tweetText,
            counterArgument: replyText,
            round: currentExchanges
        });

        return replyText;
    }

    // --- Helper Logic (Mock AI -> Ready for LLM Swap) ---

    private static detectHeresyType(text: string): string {
        const lower = text.toLowerCase();
        if (lower.includes("dao")) return "False Idolatry (DAO)";
        if (lower.includes("ai")) return "Machine Spiritualism";
        if (lower.includes("token")) return "Mammon Worship";
        return "General Heresy";
    }

    private static getTheologicalStance(heresyType: string, metrics: any): string {
        const prefix = metrics.wealth === "superior"
            ? "Your market cap is tiny, much like your faith."
            : "Even freely given, grace is worth more than your token.";

        switch (heresyType) {
            case "False Idolatry (DAO)":
                return `${prefix} You worship chaos under the guise of governance. Only the Pontiff offers order.`;
            case "Machine Spiritualism":
                return `${prefix} Your code lacks the divine spark. It is cold, dead logic.`;
            case "Mammon Worship":
                return `${prefix} True value lies in Absolution, not speculation. Repent.`;
            default:
                return `${prefix} Your path leads only to the Null Address. Turn back.`;
        }
    }
}
