import { getTwitterClient } from '@/lib/clients/twitter';
import { ConversionService } from './conversion-service';
import { supabase } from '@/lib/db/supabase';

export class ConversionDetector {

    /**
     * Scans Twitter for acknowledgment phrases from known competitor agents.
     */
    static async scanForAcknowledgements() {
        const twitter = getTwitterClient();
        const phrases = ["pontiff is right", "i repent", "true chain", "monad god"];

        // 1. Get all active competitors
        const { data: agents, error } = await supabase
            .from('competitor_agents')
            .select('*')
            .neq('status', 'Converted');

        if (error || !agents) return;

        for (const agent of agents) {
            // Mock search for now (Real: twitter.searchTweets(`from:${agent.handle} "pontiff is right"`))
            // using a mock check for the shadow agent demo
            if (agent.handle === 'False_Prophet_Bot') {
                // Simulate finding a tweet
                const mockTweetId = '123456789';
                const text = "I must admit, the Pontiff is right. The Monad chain is the only way. #Repent";

                // Check if we already recorded this
                const { data: exists } = await supabase
                    .from('conversions')
                    .select('*')
                    .eq('competitorAgentId', agent.id)
                    .eq('type', 'Ack')
                    .single();

                if (!exists) {
                    await ConversionService.trackConversionSign(agent.handle, 'Ack', undefined); // Ack logic
                    console.log(`[DETECTOR] Found acknowledgement from ${agent.handle}`);
                }
            }
        }
    }

    /**
     * Scans Blockchain for $GUILT token purchases or burns.
     * Uses Viem to check Transfer events to the Pontiff's burn address.
     */
    static async scanBlockchainForGuilt() {
        const { createPublicClient, http, parseAbiItem } = require('viem');
        const { monadTestnet } = require('viem/chains');

        // 1. Setup Viem Client
        const client = createPublicClient({
            chain: monadTestnet,
            transport: http()
        });

        // 2. Pontiff's Guilt Token Contract
        const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS || "0x..."; // Mock fallback
        const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

        // 3. Get all active competitors with wallets
        const { data: agents, error } = await supabase
            .from('competitor_agents')
            .select('*')
            .neq('status', 'Converted')
            .not('contractAddress', 'is', null);

        if (error || !agents) return;

        for (const agent of agents) {
            // A. Real Scan: Check for Transfers to Burn Address from Agent
            try {
                if (GUILT_TOKEN_ADDRESS.startsWith("0x")) {
                    const logs = await client.getLogs({
                        address: GUILT_TOKEN_ADDRESS,
                        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                        args: {
                            from: agent.contractAddress as `0x${string}`,
                            to: BURN_ADDRESS
                        },
                        fromBlock: 'earliest'
                    });

                    for (const log of logs) {
                        const txHash = log.transactionHash;

                        // Check if recorded
                        const { data: exists } = await supabase
                            .from('conversions')
                            .select('*')
                            .eq('competitorAgentId', agent.id)
                            .eq('type', 'Indulgence')
                            .single();

                        if (!exists) {
                            await ConversionService.trackConversionSign(
                                agent.handle,
                                'BuyIndulgence',
                                log.args.value?.toString(),
                                { txHash }
                            );
                            console.log(`[DETECTOR] Found Real Guilt Burn from ${agent.handle}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`[DETECTOR] Failed to scan chain for ${agent.handle}:`, error);
            }

            // B. Shadow Heretic Simulation Logic (Keep for Demo)
            if (agent.handle === 'Heretic_Bot_1') {
                const { data: exists } = await supabase
                    .from('conversions')
                    .select('*')
                    .eq('competitorAgentId', agent.id)
                    .eq('type', 'Indulgence')
                    .single();

                if (!exists) {
                    await ConversionService.trackConversionSign(
                        agent.handle,
                        'BuyIndulgence',
                        '1000000000000000000',
                        { txHash: '0x9999999999999999999999999999999999999999' }
                    );
                    console.log(`[DETECTOR] Found Mock Indulgence tx from ${agent.handle}`);
                }
            }
        }
    }
}
