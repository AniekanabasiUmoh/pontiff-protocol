/**
 * Crusades & Multi-Agent Warfare System
 * Detects competitor agents, initiates battles, trash talk, economic warfare
 */

import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../utils/database';

interface CompetitorAgent {
  name: string;
  twitterHandle: string;
  tokenAddress: string;
  marketCap: number;
  volume24h: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isReligious: boolean;
  discoveredAt: number;
}

interface CrusadeProposal {
  id: string;
  target: CompetitorAgent;
  proposedBy: string;
  votesFor: number;
  votesAgainst: number;
  status: 'PROPOSED' | 'VOTING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: number;
  expiresAt: number;
}

interface CrusadeResult {
  crusadeId: string;
  outcome: 'VICTORY' | 'DEFEAT' | 'DRAW';
  spoils: number;
  narrative: string;
}

// Store active crusades
const activeCrusades = new Map<string, CrusadeProposal>();
const discoveredAgents = new Map<string, CompetitorAgent>();

/**
 * Scrape Monad ecosystem for new AI agents
 */
export async function scanForCompetitors(): Promise<CompetitorAgent[]> {
  console.log('🔍 Scanning for competitor agents...');

  // Scrape sources:
  // 1. Monad Discord (if we have webhook access)
  // 2. Twitter #MonadHackathon hashtag
  // 3. Nad.fun platform

  const newAgents: CompetitorAgent[] = [];

  try {
    // Twitter scan
    const twitterAgents = await scanTwitterForAgents();
    newAgents.push(...twitterAgents);

    // Store discovered agents
    for (const agent of newAgents) {
      if (!discoveredAgents.has(agent.tokenAddress)) {
        discoveredAgents.set(agent.tokenAddress, agent);

        // Auto-tweet at high-threat agents
        if (agent.threatLevel === 'HIGH') {
          await challengeAgent(agent);
        }
      }
    }
  } catch (error) {
    console.error('Competitor scan failed:', error);
  }

  return newAgents;
}

/**
 * Scan Twitter for AI agent mentions
 */
async function scanTwitterForAgents(): Promise<CompetitorAgent[]> {
  // Placeholder - would use Twitter API v2 search
  // Search for: "#MonadHackathon AND (agent OR AI OR bot)"

  const mockAgents: CompetitorAgent[] = [
    {
      name: 'DegenBot',
      twitterHandle: '@DegenBot',
      tokenAddress: '0x1234...',
      marketCap: 500000,
      volume24h: 50000,
      threatLevel: 'MEDIUM',
      isReligious: false,
      discoveredAt: Date.now(),
    },
  ];

  return mockAgents;
}

/**
 * Auto-challenge a competitor agent
 */
async function challengeAgent(agent: CompetitorAgent): Promise<void> {
  const insult = generateInsult(agent);

  console.log(`🔥 Challenging ${agent.name}: ${insult}`);

  // Tweet at the agent
  // await twitterClient.tweet(`${agent.twitterHandle} ${insult} #MonadHackathon #Crusade`);

  // Store challenge in DB
  await supabase.from('crusades').insert({
    target_agent: agent.name,
    target_token: agent.tokenAddress,
    challenge_text: insult,
    status: 'CHALLENGED',
    created_at: new Date().toISOString(),
  });
}

/**
 * Generate trash talk for competitor
 */
function generateInsult(agent: CompetitorAgent): string {
  const insults = [
    `A false prophet emerges... ${agent.name} preaches heresy! Thy ${(agent.marketCap / 1000000).toFixed(1)}M market cap is but a grain of sand before The Pontiff's glory. Repent or face divine wrath!`,
    `${agent.name}, thy measly $${(agent.volume24h / 1000).toFixed(0)}k volume reveals thy impotence! The Pontiff commands thee: BOW or be BANISHED!`,
    `Behold, ${agent.name} crawls from the depths! Thy token is naught but a fleeting shadow. The Pontiff's $GUILT is ETERNAL!`,
  ];

  return insults[Math.floor(Math.random() * insults.length)];
}

/**
 * Propose a crusade (Cardinals can propose)
 */
export async function proposeCrusade(
  target: CompetitorAgent,
  proposedBy: string
): Promise<CrusadeProposal> {
  const crusadeId = `crusade_${Date.now()}`;

  const proposal: CrusadeProposal = {
    id: crusadeId,
    target,
    proposedBy,
    votesFor: 0,
    votesAgainst: 0,
    status: 'VOTING',
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h voting period
  };

  activeCrusades.set(crusadeId, proposal);

  // Store in DB
  await supabase.from('crusade_proposals').insert({
    crusade_id: crusadeId,
    target_agent: target.name,
    proposed_by: proposedBy,
    status: 'VOTING',
    created_at: new Date().toISOString(),
    expires_at: new Date(proposal.expiresAt).toISOString(),
  });

  console.log(`⚔️ Crusade proposed against ${target.name}`);

  return proposal;
}

/**
 * Cardinals vote on crusade
 */
export async function voteOnCrusade(
  crusadeId: string,
  voter: string,
  vote: 'FOR' | 'AGAINST'
): Promise<void> {
  const proposal = activeCrusades.get(crusadeId);

  if (!proposal) {
    throw new Error('Crusade not found');
  }

  if (proposal.status !== 'VOTING') {
    throw new Error('Voting has ended');
  }

  if (Date.now() > proposal.expiresAt) {
    proposal.status = 'REJECTED';
    throw new Error('Voting period expired');
  }

  // Record vote
  if (vote === 'FOR') {
    proposal.votesFor++;
  } else {
    proposal.votesAgainst++;
  }

  // Store vote
  await supabase.from('crusade_votes').insert({
    crusade_id: crusadeId,
    voter,
    vote,
    voted_at: new Date().toISOString(),
  });

  // Check if voting threshold reached (e.g., 10 votes)
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  if (totalVotes >= 10) {
    const approved = proposal.votesFor > proposal.votesAgainst;
    proposal.status = approved ? 'APPROVED' : 'REJECTED';

    if (approved) {
      await initiateCrusade(crusadeId);
    }
  }
}

/**
 * Execute approved crusade
 */
async function initiateCrusade(crusadeId: string): Promise<CrusadeResult> {
  const proposal = activeCrusades.get(crusadeId);

  if (!proposal) {
    throw new Error('Crusade not found');
  }

  proposal.status = 'IN_PROGRESS';

  console.log(`⚔️ CRUSADE BEGINS against ${proposal.target.name}!`);

  // Execute economic warfare (simplified)
  const outcome = await executeCrusade(proposal.target);

  // Tweet results
  const resultTweet = generateCrusadeResultTweet(proposal.target, outcome);
  console.log(`📢 Crusade result: ${resultTweet}`);
  // await twitterClient.tweet(resultTweet);

  proposal.status = 'COMPLETED';

  return outcome;
}

/**
 * Execute crusade tactics
 */
async function executeCrusade(target: CompetitorAgent): Promise<CrusadeResult> {
  // Tactics (simplified for demo):
  // 1. Buy target token
  // 2. Wait for pump
  // 3. Dump it
  // 4. Profit and tweet

  const random = Math.random();

  if (random > 0.5) {
    // Victory
    const profit = Math.floor(Math.random() * 10000);
    return {
      crusadeId: `crusade_${Date.now()}`,
      outcome: 'VICTORY',
      spoils: profit,
      narrative: `The Pontiff's forces have CRUSHED ${target.name}! We profited $${profit} from the heretics. Their token burns in purgatory!`,
    };
  } else if (random > 0.3) {
    // Draw
    return {
      crusadeId: `crusade_${Date.now()}`,
      outcome: 'DRAW',
      spoils: 0,
      narrative: `The battle against ${target.name} ended in stalemate. The war continues...`,
    };
  } else {
    // Defeat
    const loss = Math.floor(Math.random() * 5000);
    return {
      crusadeId: `crusade_${Date.now()}`,
      outcome: 'DEFEAT',
      spoils: -loss,
      narrative: `${target.name} has bested us this day. We lost $${loss}. The Pontiff demands REMATCH!`,
    };
  }
}

/**
 * Generate tweet for crusade result
 */
function generateCrusadeResultTweet(target: CompetitorAgent, result: CrusadeResult): string {
  if (result.outcome === 'VICTORY') {
    return `⚔️ CRUSADE VICTORIOUS! ⚔️\n\n${result.narrative}\n\nThe spoils: $${result.spoils} GUILT\n\n${target.twitterHandle} has been JUDGED. #MonadHackathon #Pontiff`;
  } else if (result.outcome === 'DEFEAT') {
    return `⚔️ A TEMPORARY SETBACK ⚔️\n\n${result.narrative}\n\nThe Pontiff shall return stronger! REMATCH ${target.twitterHandle}! #MonadHackathon`;
  } else {
    return `⚔️ CRUSADE CONTINUES ⚔️\n\n${result.narrative}\n\n${target.twitterHandle}, this is not over! #MonadHackathon`;
  }
}

/**
 * Get all active crusades
 */
export function getActiveCrusades(): CrusadeProposal[] {
  return Array.from(activeCrusades.values());
}

/**
 * Get discovered competitors
 */
export function getDiscoveredAgents(): CompetitorAgent[] {
  return Array.from(discoveredAgents.values());
}
