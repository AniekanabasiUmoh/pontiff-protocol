import { createPublicClient, http, formatEther } from 'viem';
import { monadTestnet } from 'viem/chains';

const client = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

export async function scanWalletForSins(walletAddress: string): Promise<string[]> {
    const sins: string[] = [];

    try {
        // 1. Check Balance (Sin of Poverty / Greed)
        const balance = await client.getBalance({ address: walletAddress as `0x${string}` });
        const ethBalance = parseFloat(formatEther(balance));

        if (ethBalance < 0.1) {
            sins.push("The Sin of Poverty: You come to the Vatican with empty pockets.");
        } else if (ethBalance > 100) {
            sins.push("The Sin of Gluttony: Hoarding wealth while the faithful suffer.");
        }

        // 2. Check Transaction Count (Sin of Sloth / Wrath)
        const txCount = await client.getTransactionCount({ address: walletAddress as `0x${string}` });

        if (txCount < 5) {
            sins.push("The Sin of Sloth: Your wallet is dormant, lacking conviction.");
        } else if (txCount > 1000) {
            sins.push("The Sin of Wrath: Spaming the network with degenerate fury.");
        }

        // 3. Address Check (Vanity / Heresy)
        if (walletAddress.toLowerCase().startsWith("0x0000")) {
            sins.push("The Sin of Vanity: Obsessing over a clear address instead of a clear soul.");
        }

        // Default Sin if clean
        if (sins.length === 0) {
            sins.push("The Sin of Pride: Believing yourself to be without sin.");
        }

        return sins;

    } catch (error) {
        console.error("Error scanning sins:", error);
        return ["The Sin of Obscurity: Your wallet is hidden from the divine gaze."];
    }
}
