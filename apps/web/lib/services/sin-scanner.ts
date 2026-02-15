import { createPublicClient, http, formatEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { createServerSupabase } from '../db/supabase-server';

const client = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

export interface Sin {
    type: string;
    severity: 'venial' | 'mortal' | 'cardinal';
    description: string;
}

export interface SinScanResult {
    sins: Sin[];
    balance: string;
    nonce: number;
}

// Enhanced Sin Scanner with Real Chain Data
export async function scanWalletForSins(walletAddress: string): Promise<SinScanResult> {
    const sins: Sin[] = [];
    const address = walletAddress as `0x${string}`;
    let ethBalance = "0";
    let nonce = 0;

    try {
        // Parallelize RPC calls for speed
        const [balanceWei, txCount, code] = await Promise.all([
            client.getBalance({ address }),
            client.getTransactionCount({ address }),
            client.getBytecode({ address })
        ]);

        ethBalance = formatEther(balanceWei);
        nonce = txCount;
        const floatBalance = parseFloat(ethBalance);
        const isContract = code && code.length > 2;

        // --- 1. WEALTH SINS ---
        if (floatBalance < 0.01) {
            sins.push({
                type: "The Sin of Poverty",
                severity: "venial",
                description: "A wallet devoid of value, offering nothing to the ecosystem."
            });
        }
        if (floatBalance > 1000) {
            sins.push({
                type: "The Sin of Gluttony (Whale)",
                severity: "mortal",
                description: "Hoarding vast sums of testnet tokens while others starve."
            });
        } else if (floatBalance > 100) {
            sins.push({
                type: "The Sin of Greed",
                severity: "venial",
                description: "Accumulating wealth beyond your needs."
            });
        }

        // --- 2. ACTIVITY SINS ---
        if (nonce === 0) {
            sins.push({
                type: "The Sin of Sloth (Ghost Wallet)",
                severity: "mortal",
                description: "You have effectively done nothing. You exist, yet you do not act."
            });
        } else if (nonce > 1000) {
            sins.push({
                type: "The Sin of Wrath (Spammer)",
                severity: "venial",
                description: "Spamming the chain with reckless abandon and infinite rage."
            });
        }

        // --- 3. PATTERN SINS ---
        if (walletAddress.toLowerCase().startsWith("0x00") || walletAddress.toLowerCase().startsWith("0xdead")) {
            sins.push({
                type: "The Sin of Vanity",
                severity: "venial",
                description: "Obsessing over a clear address instead of clear actions."
            });
        }

        // Gas Guzzler Heuristic: High nonce but low balance
        if (nonce > 50 && floatBalance < 0.1) {
            sins.push({
                type: "The Sin of Waste (Gas Guzzler)",
                severity: "venial",
                description: "Burning gas with nothing to show for it but dust."
            });
        }

        // --- 4. PROTOCOL LOYALTY SINS (Sermon Skipper) ---
        // Check if they have played any games in Pontiff
        const { count, error } = await createServerSupabase()
            .from('games')
            .select('*', { count: 'exact', head: true })
            .or(`player1.eq.${walletAddress},player2.eq.${walletAddress}`);

        if (!error && (count === null || count === 0)) {
            sins.push({
                type: "The Sin of Apostasy (Sermon Skipper)",
                severity: "cardinal",
                description: "You have not partaken in the holy games of the Pontiff. You are a stranger to our rites."
            });
        } else if (count && count > 50) {
            // Maybe a virtue, or maybe addiction?
            // Let's call it "Zealotry" if we wanted, but let's stick to sins.
        }

        // Default if saintly
        if (sins.length === 0) {
            sins.push({
                type: "The Sin of Pride",
                severity: "mortal",
                description: "Believing yourself to be without sin is the greatest sin of all."
            });
        }

        return { sins, balance: ethBalance, nonce };

    } catch (error) {
        console.error("Error scanning sins:", error);
        // Fallback sins if RPC fails
        return {
            sins: [{
                type: "The Sin of Obscurity",
                severity: "venial",
                description: "Your wallet keeps its secrets well from the scanner."
            }],
            balance: "0",
            nonce: 0
        };
    }
}
