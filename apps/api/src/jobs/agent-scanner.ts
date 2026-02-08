/**
 * Scheduled Job: Agent Scanner
 * Runs every 4 hours to scan for competitor agents and track conversions
 */

import { scanForCompetitorAgents } from '../services/agent-detection';
import { trackAllConversions } from '../services/conversion-tracking';
import { twitterClient } from '../services/twitter';

export async function runAgentScannerJob() {
    console.log('🔍 Starting agent scanner job...');

    try {
        // Step 1: Scan for new competitor agents
        console.log('📡 Scanning for competitor agents...');
        const agents = await scanForCompetitorAgents(twitterClient || undefined);
        console.log(`✅ Found ${agents.length} competitor agents`);

        // Step 2: Track conversions for all agents
        console.log('🎯 Tracking conversions...');
        const conversions = await trackAllConversions(twitterClient || undefined);
        console.log(`✅ Tracked ${conversions.length} conversions`);

        console.log('🎉 Agent scanner job complete!');

        return {
            success: true,
            agentsFound: agents.length,
            conversionsTracked: conversions.length,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('❌ Agent scanner job failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
        };
    }
}

// Run immediately if executed directly
if (require.main === module) {
    runAgentScannerJob()
        .then((result) => {
            console.log('Job result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Job crashed:', error);
            process.exit(1);
        });
}
