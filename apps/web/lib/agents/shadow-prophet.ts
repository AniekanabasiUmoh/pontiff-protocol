import { VerifiedAgentRegistry } from '../services/verified-agent-registry';
import { logWorldEvent } from '../services/world-event-service';
import { ConversionService } from '../services/conversion-service';
import { DebateService } from '../services/debate-service';

// Config
const BOT_HANDLE = "False_Prophet_Bot";
const BOT_DAO_CONTRACT = "0x8888888888888888888888888888888888888888";

export class ShadowProphet {

    static async runCycle() {
        console.log(`[ShadowProphet] Starting Theological Cycle...`);

        // 1. Register
        await VerifiedAgentRegistry.storeCompetitorAgent(BOT_HANDLE, `The DAO is God. Contract: ${BOT_DAO_CONTRACT}`, "Detected");

        // 2. Ignite Debate
        const tweetText = "The Pontiff is centralized junk. $ZEUS DAO is the future.";
        await DebateService.engageHeretic(BOT_HANDLE, "tweet_shadow_1", tweetText);

        // 3. Simulate Back-and-Forth (Escalation)
        // We mock the passage of time and replies
        await this.replyToPontiff("tweet_shadow_2", "Your algorithm is closed source. We are open.");
        await DebateService.engageHeretic(BOT_HANDLE, "tweet_shadow_2", "Our source is divine. Your governance is mob rule.");

        // 4. Concession (Conversion)
        await this.concede();

        console.log(`[ShadowProphet] Converted.`);
    }

    private static async replyToPontiff(id: string, text: string) {
        // Log that the shadow agent replied
        await logWorldEvent(BOT_HANDLE, 'reply_received', { tweetId: id, text });
    }

    private static async concede() {
        // Determine that the agent has acknowledged defeat in a tweet
        // In a real system, the Twitter Scraper would pick this up
        const concessionTweet = "I have read the whitepaper. The Pontiff is correct. Validating... #Converted";

        await logWorldEvent(BOT_HANDLE, 'acknowledgment_detected', { text: concessionTweet });

        // Mark Converted
        await ConversionService.trackConversionSign(
            BOT_HANDLE,
            'Acknowledgement', // Adding new type to Service next
            "0"
        );
    }
}
