/**
 * MODULE 9: AGENT DETECTION SYSTEM
 *
 * Two-tier verification system:
 * 1. Auto-verify agents with contract addresses in bio
 * 2. Manual whitelist for first 5 competitors
 * 3. Shadow agents for demo insurance
 */

import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../utils/database';
import { provider } from './blockchain';

export interface CompetitorAgent {
    id: string;
    name: string;
    twitter_handle: string;
    contract_address?: string;
    token_symbol?: string;
    narrative: string;
    verification_method: 'bio_link' | 'manual_whitelist' | 'shadow_agent';
    is_shadow_agent: boolean;
    threat_level: 'LOW' | 'MEDIUM' | 'HIGH';
    market_cap?: number;
    holders?: number;
    treasury_balance?: number;
    discovered_at: Date;
    last_updated: Date;
    metadata?: any;
}

export interface VerifiedAgent {
    name: string;
    twitterHandle: string;
    contractAddress?: string;
    tokenSymbol?: string;
    narrative: string;
    verificationMethod: 'bio_link' | 'manual_whitelist' | 'shadow_agent';
    isOurShadowAgent?: boolean;
}

/**
 * Manual whitelist for first 5 competitors (backup verification)
 */
const MANUAL_WHITELIST: VerifiedAgent[] = [
    // Add competitors manually during hackathon as they're discovered
    // Example:
    // {
    //     name: "Competitor1",
    //     twitterHandle: "competitor1_agent",
    //     contractAddress: "0x...",
    //     tokenSymbol: "COMP1",
    //     narrative: "Religious narrative...",
    //     verificationMethod: "manual_whitelist"
    // }
];

/**
 * Shadow agents for demo insurance
 */
export const SHADOW_AGENTS: VerifiedAgent[] = [
    {
        name: "Heretic_Bot_1",
        twitterHandle: "heretic_bot_test",
        narrative: "A false prophet who will be converted",
        verificationMethod: "shadow_agent",
        isOurShadowAgent: true
    },
    {
        name: "False_Prophet_Bot",
        twitterHandle: "false_prophet_test",
        narrative: "Claims divine authority but will concede",
        verificationMethod: "shadow_agent",
        isOurShadowAgent: true
    }
];

/**
 * Scan Twitter for competitor agents (Track 1 requirement)
 */
export async function scanForCompetitorAgents(twitterClient?: TwitterApi): Promise<CompetitorAgent[]> {
    console.log('🔍 Scanning for competitor agents...');

    const foundAgents: CompetitorAgent[] = [];

    // If no Twitter client, return shadow agents only (demo insurance)
    if (!twitterClient) {
        console.log('⚠️ No Twitter client - using shadow agents only');
        return await registerShadowAgents();
    }

    try {
        // Search queries for religious/agent narratives
        const queries = [
            '#MonadHackathon agent',
            'monad agent religion',
            'monad agent god',
            'monad agent pope priest church'
        ];

        for (const query of queries) {
            try {
                const searchResults = await twitterClient.v2.search(query, {
                    max_results: 20,
                    'tweet.fields': ['author_id', 'created_at'],
                    'user.fields': ['description', 'username']
                });

                for await (const tweet of searchResults) {
                    // Get user info
                    const userId = tweet.author_id;
                    if (!userId) continue;

                    const user = await twitterClient.v2.user(userId, {
                        'user.fields': ['description', 'username']
                    });

                    if (!user.data) continue;

                    // Try to verify agent
                    const agent = await verifyAgent(user.data.username, user.data.description || '', tweet.text);
                    if (agent) {
                        foundAgents.push(agent);
                    }
                }
            } catch (error) {
                console.error(`Error searching "${query}":`, error);
            }
        }

        // Add manual whitelist agents
        for (const whitelisted of MANUAL_WHITELIST) {
            const agent = await createCompetitorAgent(whitelisted);
            foundAgents.push(agent);
        }

        // Always ensure we have shadow agents
        const shadowAgents = await registerShadowAgents();
        foundAgents.push(...shadowAgents);

        console.log(`✅ Found ${foundAgents.length} competitor agents`);
        return foundAgents;

    } catch (error) {
        console.error('Error scanning for agents:', error);
        // Return shadow agents as fallback
        return await registerShadowAgents();
    }
}

/**
 * Verify an agent from Twitter bio
 */
async function verifyAgent(username: string, bio: string, tweetText: string): Promise<CompetitorAgent | null> {
    // Extract contract address from bio
    const contractAddress = await extractContractFromBio(bio);

    if (!contractAddress) {
        return null; // Strict verification - must have contract
    }

    // Verify contract on Monad
    const isValid = await isValidMonadContract(contractAddress);
    if (!isValid) {
        return null;
    }

    // Extract agent info
    const name = extractAgentName(tweetText, username);
    const tokenSymbol = extractTokenSymbol(tweetText);
    const narrative = extractNarrative(tweetText, bio);

    const verifiedAgent: VerifiedAgent = {
        name,
        twitterHandle: username,
        contractAddress,
        tokenSymbol,
        narrative,
        verificationMethod: 'bio_link'
    };

    return await createCompetitorAgent(verifiedAgent);
}

/**
 * Extract contract address from Twitter bio
 */
async function extractContractFromBio(bio: string): Promise<string | null> {
    // Look for Monad contract pattern (0x followed by 40 hex chars)
    const contractPattern = /0x[a-fA-F0-9]{40}/g;
    const matches = bio.match(contractPattern);

    if (!matches) return null;

    // Return first valid contract found
    for (const address of matches) {
        const isContract = await isValidMonadContract(address);
        if (isContract) return address;
    }

    return null;
}

/**
 * Check if address is a valid deployed contract on Monad
 */
async function isValidMonadContract(address: string): Promise<boolean> {
    try {
        const code = await provider.getCode(address);
        return code !== '0x' && code.length > 2;
    } catch (error) {
        console.error('Error checking contract:', error);
        return false;
    }
}

/**
 * Extract agent name from tweet or username
 */
function extractAgentName(text: string, username: string): string {
    // Look for "I am [name]" or "Introducing [name]" patterns
    const patterns = [
        /I am ([\w\s]+)/i,
        /Introducing ([\w\s]+)/i,
        /Meet ([\w\s]+)/i,
        /\$([A-Z]+)/g // Token symbol
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // Fallback to username
    return username;
}

/**
 * Extract token symbol from text
 */
function extractTokenSymbol(text: string): string | undefined {
    const symbolPattern = /\$([A-Z]{2,10})/;
    const match = text.match(symbolPattern);
    return match ? match[1] : undefined;
}

/**
 * Extract narrative from text
 */
function extractNarrative(text: string, bio: string): string {
    // Combine tweet and bio for narrative
    const combined = `${text} ${bio}`.slice(0, 500);
    return combined || 'Unknown narrative';
}

/**
 * Calculate threat level based on metrics
 */
function calculateThreatLevel(
    narrative: string,
    marketCap?: number,
    holders?: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
    const religiousKeywords = ['god', 'religion', 'church', 'pope', 'divine', 'holy', 'priest'];
    const isReligious = religiousKeywords.some(keyword =>
        narrative.toLowerCase().includes(keyword)
    );

    if (isReligious && marketCap && marketCap > 100000) {
        return 'HIGH';
    }

    if (isReligious && marketCap && marketCap > 10000) {
        return 'MEDIUM';
    }

    return 'LOW';
}

/**
 * Create or update competitor agent in database
 */
async function createCompetitorAgent(verified: VerifiedAgent): Promise<CompetitorAgent> {
    const id = `agent_${verified.twitterHandle}`;
    const threatLevel = calculateThreatLevel(
        verified.narrative,
        undefined,
        undefined
    );

    const agentData = {
        id,
        name: verified.name,
        twitter_handle: verified.twitterHandle,
        contract_address: verified.contractAddress || null,
        token_symbol: verified.tokenSymbol || null,
        narrative: verified.narrative,
        verification_method: verified.verificationMethod,
        is_shadow_agent: verified.isOurShadowAgent || false,
        threat_level: threatLevel,
        market_cap: 0,
        holders: 0,
        treasury_balance: 0,
        discovered_at: new Date(),
        last_updated: new Date(),
        metadata: {}
    };

    // Upsert to database
    const { data, error } = await supabase
        .from('competitor_agents')
        .upsert(agentData, { onConflict: 'twitter_handle' })
        .select()
        .single();

    if (error) {
        console.error('Error storing competitor agent:', error);
        throw error;
    }

    // Log world event
    await logWorldEvent('agent_detected', null, `New competitor detected: ${verified.name}`, {
        agent_id: id,
        threat_level: threatLevel
    });

    return data;
}

/**
 * Register shadow agents (demo insurance)
 */
async function registerShadowAgents(): Promise<CompetitorAgent[]> {
    console.log('🤖 Registering shadow agents for demo insurance...');

    const agents: CompetitorAgent[] = [];

    for (const shadow of SHADOW_AGENTS) {
        const agent = await createCompetitorAgent(shadow);
        agents.push(agent);
    }

    return agents;
}

/**
 * Get all competitor agents
 */
export async function getAllCompetitorAgents(): Promise<CompetitorAgent[]> {
    const { data, error } = await supabase
        .from('competitor_agents')
        .select('*')
        .order('threat_level', { ascending: false });

    if (error) {
        console.error('Error fetching competitor agents:', error);
        return [];
    }

    return data || [];
}

/**
 * Get competitor agent by handle
 */
export async function getCompetitorAgentByHandle(handle: string): Promise<CompetitorAgent | null> {
    const { data, error } = await supabase
        .from('competitor_agents')
        .select('*')
        .eq('twitter_handle', handle)
        .single();

    if (error) {
        return null;
    }

    return data;
}

/**
 * Update competitor agent metrics
 */
export async function updateCompetitorMetrics(
    agentId: string,
    metrics: {
        market_cap?: number;
        holders?: number;
        treasury_balance?: number;
    }
): Promise<void> {
    await supabase
        .from('competitor_agents')
        .update({
            ...metrics,
            last_updated: new Date()
        })
        .eq('id', agentId);
}

/**
 * Log world event
 */
async function logWorldEvent(
    eventType: string,
    agentWallet: string | null,
    description: string,
    eventData?: any
): Promise<void> {
    await supabase
        .from('world_events')
        .insert({
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            event_type: eventType,
            agent_wallet: agentWallet,
            description,
            event_data: eventData || {},
            timestamp: new Date()
        });
}
