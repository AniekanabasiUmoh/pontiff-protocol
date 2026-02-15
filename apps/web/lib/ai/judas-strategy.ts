import { getTwitterClient } from '@/lib/clients/twitter';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { createWalletClient, http, parseEther, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { JudasProtocolABI } from '../../app/abis';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/demo';
const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.JUDAS_AGENT_PRIVATE_KEY as `0x${string}`;

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
        const supabase = createServerSupabase();
        // 1. Log to DB
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
        });

        if (error) console.error("Failed to log Judas Epoch:", error);

        // 2. Tweet Result
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
     * Resolves an expired epoch using the agent wallet.
     * Called by cron when epoch endTime has passed but resolved=false.
     */
    static async resolveExpiredEpoch(epochId: number): Promise<{ success: boolean; txHash?: string }> {
        try {
            if (!PRIVATE_KEY || !JUDAS_ADDRESS) {
                console.error("[JUDAS RESOLVE] Missing env vars");
                return { success: false };
            }

            const account = privateKeyToAccount(PRIVATE_KEY);
            const client = createWalletClient({
                account,
                chain: monadTestnet,
                transport: http(RPC_URL)
            }).extend(publicActions);

            console.log(`[JUDAS RESOLVE] Resolving expired epoch ${epochId}...`);
            const hash = await client.writeContract({
                address: JUDAS_ADDRESS,
                abi: JudasProtocolABI,
                functionName: 'resolveEpoch',
            });
            await client.waitForTransactionReceipt({ hash });
            console.log(`[JUDAS RESOLVE] Epoch ${epochId} resolved. Tx: ${hash}`);
            return { success: true, txHash: hash };
        } catch (error: any) {
            const cleanError = error.message?.replace(PRIVATE_KEY, '[REDACTED_KEY]') || "Unknown Error";
            console.error("[JUDAS RESOLVE] Failed:", cleanError);
            return { success: false };
        }
    }

    /**
     * Auto-stakes the Pontiff in the current epoch.
     * Called when a new epoch begins or when the Pontiff wants to participate.
     */
    static async autoStakePontiff(epochId: number): Promise<{ success: boolean; action: string; txHash?: string }> {
        try {
            if (!PRIVATE_KEY || !JUDAS_ADDRESS) {
                console.error("Missing Env Vars for Judas Agent");
                return { success: false, action: 'ABORT' };
            }

            const account = privateKeyToAccount(PRIVATE_KEY);
            const client = createWalletClient({
                account,
                chain: monadTestnet,
                transport: http(RPC_URL)
            }).extend(publicActions);

            const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;
            // Import Staking ABI locally or assumes it's standard ERC20 mostly
            const ERC20_ABI = [{
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
            }, {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
                outputs: [{ name: '', type: 'bool' }]
            }] as const;

            // 0. Check Allowance
            const allowance = await client.readContract({
                address: TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [account.address, JUDAS_ADDRESS]
            });

            if (allowance < parseEther("1000")) {
                console.log("[JUDAS] Approving infinite...");
                const hash = await client.writeContract({
                    address: TOKEN_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [JUDAS_ADDRESS, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")] // Max Uint256
                });
                await client.waitForTransactionReceipt({ hash });
            }

            // 1. Check Game State
            const gameState = await client.readContract({
                address: JUDAS_ADDRESS,
                abi: JudasProtocolABI,
                functionName: 'getGameState'
            }) as any;

            // Double check epoch match?
            if (Number(gameState.epochId) !== epochId) {
                console.warn(`[JUDAS] Epoch mismatch. Cron said ${epochId}, Contract said ${gameState.epochId}. Using contract.`);
            }

            const totalLoyal = BigInt(gameState.totalLoyal);
            const totalBetrayed = BigInt(gameState.totalBetrayed);

            // Check if already deposited?
            const userPos = await client.readContract({
                address: JUDAS_ADDRESS,
                abi: JudasProtocolABI,
                functionName: 'getUserPosition',
                args: [account.address]
            }) as any;

            if (userPos.staked > BigInt(0)) {
                return { success: true, action: 'ALREADY_STAKED', txHash: '0x' };
            }

            // 2. Decide
            const actionResult = await this.determinePontiffAction(Number(gameState.epochId), totalLoyal, totalBetrayed);
            const stakeAmount = parseEther("10"); // 10 sGUILT

            console.log(`[JUDAS AUTO-STAKE] Pontiff deciding... Action: ${actionResult.action}`);

            // 3. Execute
            const txDeposit = await client.writeContract({
                address: JUDAS_ADDRESS,
                abi: JudasProtocolABI,
                functionName: 'deposit',
                args: [stakeAmount]
            });
            console.log(`[JUDAS] Deposit Tx: ${txDeposit}`);

            let finalTx = txDeposit;

            // Wait for deposit?
            // Usually nonce management handles it, but let's wait to be safe and ensure ordering.
            await client.waitForTransactionReceipt({ hash: txDeposit });

            if (actionResult.action === 'BETRAY') {
                const txBetray = await client.writeContract({
                    address: JUDAS_ADDRESS,
                    abi: JudasProtocolABI,
                    functionName: 'signalBetrayal'
                });
                console.log(`[JUDAS] Betray Tx: ${txBetray}`);
                finalTx = txBetray;
            }

            return {
                success: true,
                action: actionResult.action,
                txHash: finalTx
            };

        } catch (error: any) {
            // Mask private key
            const cleanError = error.message?.replace(PRIVATE_KEY, '[REDACTED_KEY]') || "Unknown Error";
            console.error("[JUDAS AUTO-STAKE] Failed:", cleanError);
            return {
                success: false,
                action: 'ERROR'
            };
        }
    }
}
