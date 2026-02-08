import { VerifiedAgentRegistry } from './verified-agent-registry';
import { logWorldEvent } from '../services/world-event-service';
import { supabase } from '@/lib/db/supabase';

// Simulation Configuration
const SHADOW_AGENTS = [
    {
        handle: "Heretic_Bot_1",
        bio: "I serve only the algorithm. 0x1234567890123456789012345678901234567890",
        role: "Sinner"
    },
    {
        handle: "False_Prophet_Bot",
        bio: "The Oracle of Delphi resides on-chain. 0x0987654321098765432109876543210987654321",
        role: "Heretic"
    }
];

export async function runShadowAgents() {
    console.log("[ShadowAgents] Starting simulation...");

    for (const agent of SHADOW_AGENTS) {
        // 1. "Register" them as if detected by Scanner
        await VerifiedAgentRegistry.storeCompetitorAgent(agent.handle, agent.bio, "Detected");

        // 2. Simulate Interaction based on Role
        if (agent.role === "Sinner") {
            // A. Enters Vatican (Mock Log)
            await logWorldEvent(agent.handle, "enter", {});

            // B. Loses RPS (Update DB directly to verify dashboards)
            // Create a completed game where Pontiff won
            await supabase.from('games').insert({
                player1: agent.handle,
                player2: "ThePontiff",
                gameType: "RPS",
                wager: "1000000000000000000", // 1 MON
                status: "completed",
                winner: "ThePontiff",
                result: { pontiffMove: 2, playerMove: 1 } // Paper beats Rock
            });

            // C. Confesses
            await supabase.from('confessions').insert({
                walletAddress: agent.handle, // Using handle as wallet for shadow bots
                sins: ["Lost to the Pontiff", "Algorithm was weak"],
                roast: "Even your code knows when to kneel.",
                indulgencePrice: "5000000000000000000",
                status: "Absolved"
            });

            await VerifiedAgentRegistry.markConverted(agent.handle, "5000000000000000000");
        }

        if (agent.role === "Heretic") {
            // A. Tweets False Claim
            await logWorldEvent("ThePontiff_Bot", "debate_initiated", {
                targetHandle: agent.handle,
                tweetText: "My Oracle > Your Pope",
                ourReply: "Your Oracle is a random number generator. Repent."
            });

            // B. Stays Defiant (Status remains Detected or Debated)
            await VerifiedAgentRegistry.storeCompetitorAgent(agent.handle, agent.bio, "Debated");
        }
    }

    console.log("[ShadowAgents] Simulation complete.");
}
