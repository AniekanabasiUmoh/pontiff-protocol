import { verifyMessage } from 'viem';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains'; // Defaults, valid for verifyMessage usually

/**
 * Verify that a request was signed by the claimed wallet.
 * 
 * Expected Message Format: "Pontiff Action: {action} at {timestamp}"
 * 
 * @param message The raw message string that was signed
 * @param signature The hex signature provided by the client
 * @param walletAddress The claimed wallet address
 * @returns boolean True if signature is valid and timestamp is within window
 */
export async function verifyWalletSignature(
    message: string,
    signature: string,
    walletAddress: string
): Promise<boolean> {
    try {
        // 1. Verify Structure & Timestamp
        // "Pontiff Action: START_AGENT at 1700000000000"
        const match = message.match(/at (\d+)$/);
        if (!match) {
            console.error("Invalid message format");
            return false;
        }

        const timestamp = parseInt(match[1]);
        const now = Date.now();
        const windowMs = 60 * 1000; // 60 seconds

        if (Math.abs(now - timestamp) > windowMs) {
            console.error("Signature expired (replay protection)");
            return false;
        }

        // 2. Verify Signature using Viem
        const valid = await verifyMessage({
            address: walletAddress as `0x${string}`,
            message: message,
            signature: signature as `0x${string}`,
        });

        return valid;

    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}
