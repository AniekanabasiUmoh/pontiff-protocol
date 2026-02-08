import { getTwitterClient } from '@/lib/clients/twitter';
import { supabase } from '@/lib/db/supabase';

export class JudasStrategy {

    /**
     * Determines whether the Pontiff should Betray or Cooperate (Loyal) in the current Epoch.
     * Uses Game Theory thresholds + LLM Personality.
     */
    static async determinePontiffAction(epochId: number, totalLoyal: bigint, totalBetrayed: bigint): Promise<{ action: 'BETRAY' | 'COOPERATE', reason: string }> {
        const loyal = Number(totalLoyal);
        const betrayed = Number(totalBetrayed);
        const total = loyal + betrayed;

        // 1. Calculate Betrayal Percentage
        const betrayalPct = total > 0 ? (betrayed / total) * 100 : 0;

        // 2. Strategic Thresholds (from Smart Contract)
        // < 20% = Failed Coup (Loyalists Win)
        // 20-40% = Partial Coup (Betrayers Win Small)
        // > 40% = Full Coup (Betrayers Win Big)

        let action: 'BETRAY' | 'COOPERATE' = 'COOPERATE';
        let reason = "";

        // Pontiff Strategy:
        // If Betrayal is LOW (<15%), Pontiff stays Loyal to crush the few rebels.
        // If Betrayal is RISING (15-35%), Pontiff Betrays to join the winning side of a Partial Coup.
        // If Betrayal is HIGH (>40%), Pontiff stays Loyal to represent the "Martyr" (or Betrays to minimize loss? Contract says Betrayers win big).

        // Let's randomize slightly for "Chaotic Neutral" AI personality
        const chaos = Math.random();

        if (betrayalPct < 15) {
            action = 'COOPERATE';
            reason = "The rebellion is weak. I shall crush them with loyalty.";
        } else if (betrayalPct >= 15 && betrayalPct < 40) {
            action = 'BETRAY';
            reason = "The winds of change are blowing. I must adapt to survive.";
        } else {
            // High betrayal environment
            if (chaos > 0.5) {
                action = 'BETRAY';
                reason = "If the ship sinks, I shall capitain the lifeboat.";
            } else {
                action = 'COOPERATE';
                reason = "I will stand as the last pillar of order, even if I burn.";
            }
        }

        return { action, reason };
    }

    /**
     * Announces the result of the Epoch on Twitter and Database.
     */
    static async processEpochResult(epochId: number, outcome: string, betrayalPct: number) {
        // 1. Log to DB
        // Find or create 'JudasGame' generic wrapper? 
        // We log a 'Game' entry for the Epoch.

        const { error } = await supabase.from('games').insert({
            player1: "ThePontiff", // Mock
            player2: "ThePeople",
            gameType: "JudasProtocol",
            status: "Completed",
            result: {
                epochId,
                outcome,
                betrayalPct: `${betrayalPct.toFixed(2)}%`,
                winner: outcome === "FAILED_COUP" ? "LOYALISTS" : "BETRAYERS"
            },
            wager: "0", // Tracks global session
            winner: outcome === "FAILED_COUP" ? "LOYALISTS" : "BETRAYERS",
            // txHash: "0xEPOCH...RESULT" // Not in schema?
        });

        if (error) console.error("Failed to log Judas Epoch:", error);

        // 2. Tweet Result
        // "⚔️ EPOCH 5 RESULTS: FAILED COUP (12% Betrayal). Loyalists purged the heretics. The Pontiff remains supreme. #JudasProtocol"

        let message = `⚔️ EPOCH ${epochId} RESULTS: ${outcome.replace('_', ' ')} (${betrayalPct.toFixed(1)}% Betrayal).\n\n`;

        if (outcome === 'FAILED_COUP') {
            message += "Loyalists have purged the heretics! 🛡️ The faithful are rewarded.";
        } else if (outcome === 'PARTIAL_COUP') {
            message += "Chaos spreads! 🗡️ Betrayers steal 20% of the treasury.";
        } else {
            message += "ANARCHY! 🏴‍☠️ A Full Coup has overthrown the order. Betrayers take 50%.";
        }

        message += "\n\nPlay: pontiff.xyz/judas #ThePontiff #Monad";

        try {
            const twitter = getTwitterClient();
            // await twitter.sendTweet(message);
            console.log("[JUDAS] Tweeted:", message);
        } catch (e) {
            console.error("Failed to tweet Judas result", e);
        }

        return message;
    }

    /**
     * Auto-stakes the Pontiff in the current epoch.
     * Called when a new epoch begins or when the Pontiff wants to participate.
     */
    static async autoStakePontiff(epochId: number): Promise<{ success: boolean; action: string }> {
        try {
            // 1. Determine Pontiff's Action for this Epoch
            // We need current epoch stats to decide, but for a new epoch, we use historical data
            // For simplicity, we'll use a strategic default or look at past pattern

            const action = await this.determinePontiffAction(epochId, BigInt(0), BigInt(0));

            // 2. Mock stake amount (In production, this would trigger a backend wallet transaction)
            const stakeAmount = "1000000000000000000000"; // 1000 sGUILT

            // 3. Log the Pontiff's intent
            console.log(`[JUDAS AUTO-STAKE] Epoch ${epochId}: Pontiff will ${action.action} with ${stakeAmount} sGUILT`);
            console.log(`[JUDAS AUTO-STAKE] Reason: ${action.reason}`);

            // 4. In production, execute contract call:
            // await judasContract.write.deposit([parseEther("1000")])
            // if (action.action === 'BETRAY') {
            //     await judasContract.write.signalBetrayal()
            // }

            return {
                success: true,
                action: action.action
            };

        } catch (error) {
            console.error("[JUDAS AUTO-STAKE] Failed:", error);
            return {
                success: false,
                action: 'COOPERATE' // Default to safe option
            };
        }
    }
}
