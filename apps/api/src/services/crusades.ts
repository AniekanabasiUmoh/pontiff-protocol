/**
 * Crusades & Multi-Agent Warfare System
 * Detects competitor agents, initiates battles, trash talk, economic warfare
 * 
 * UPDATED: All data persisted to Supabase (no more in-memory storage)
 */

import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../utils/database';

interface CompetitorAgent {
  id?: string;
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

// ============================================
// DATABASE OPERATIONS (replaces in-memory Maps)
// ============================================

/**
 * Get all active crusades from database
 */
export async function getAllCrusades(): Promise<CrusadeProposal[]> {
  try {
    const { data, error } = await supabase
      .from('crusade_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform DB rows to CrusadeProposal format
    return (data || []).map(row => ({
      id: row.crusade_id,
      target: {
        name: row.target_agent,
        twitterHandle: row.target_twitter || '',
        tokenAddress: row.target_token || '',
        marketCap: row.target_market_cap || 0,
        volume24h: row.target_volume || 0,
        threatLevel: row.threat_level || 'MEDIUM',
        isReligious: row.is_religious || false,
        discoveredAt: new Date(row.created_at).getTime()
      },
      proposedBy: row.proposed_by,
      votesFor: row.votes_for || 0,
      votesAgainst: row.votes_against || 0,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime()
    }));
  } catch (error) {
    console.error('Failed to fetch crusades:', error);
    return [];
  }
}

/**
 * Get a single crusade by ID
 */
export async function getCrusadeById(crusadeId: string): Promise<CrusadeProposal | null> {
  try {
    const { data, error } = await supabase
      .from('crusade_proposals')
      .select('*')
      .eq('crusade_id', crusadeId)
      .single();

    if (error || !data) return null;

    return {
      id: data.crusade_id,
      target: {
        name: data.target_agent,
        twitterHandle: data.target_twitter || '',
        tokenAddress: data.target_token || '',
        marketCap: data.target_market_cap || 0,
        volume24h: data.target_volume || 0,
        threatLevel: data.threat_level || 'MEDIUM',
        isReligious: data.is_religious || false,
        discoveredAt: new Date(data.created_at).getTime()
      },
      proposedBy: data.proposed_by,
      votesFor: data.votes_for || 0,
      votesAgainst: data.votes_against || 0,
      status: data.status,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.expires_at).getTime()
    };
  } catch (error) {
    console.error('Failed to fetch crusade:', error);
    return null;
  }
}

/**
 * Get all discovered competitor agents from database
 */
export async function getDiscoveredAgents(): Promise<CompetitorAgent[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_agents')
      .select('*')
      .order('discovered_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      twitterHandle: row.twitter_handle,
      tokenAddress: row.contract_address,
      marketCap: row.market_cap || 0,
      volume24h: row.volume_24h || 0,
      threatLevel: row.threat_level || 'MEDIUM',
      isReligious: row.is_religious || false,
      discoveredAt: new Date(row.discovered_at).getTime()
    }));
  } catch (error) {
    console.error('Failed to fetch competitor agents:', error);
    return [];
  }
}

/**
 * Store discovered agent in database
 */
async function storeDiscoveredAgent(agent: CompetitorAgent): Promise<void> {
  try {
    const { error } = await supabase
      .from('competitor_agents')
      .upsert({
        id: agent.id || `agent_${Date.now()}`,
        name: agent.name,
        twitter_handle: agent.twitterHandle,
        contract_address: agent.tokenAddress,
        market_cap: agent.marketCap,
        volume_24h: agent.volume24h,
        threat_level: agent.threatLevel,
        is_religious: agent.isReligious,
        discovered_at: new Date(agent.discoveredAt).toISOString(),
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'contract_address'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to store agent:', error);
  }
}

// ============================================
// COMPETITOR SCANNING
// ============================================

/**
 * Scrape Monad ecosystem for new AI agents
 */
export async function scanForCompetitors(): Promise<CompetitorAgent[]> {
  console.log('🔍 Scanning for competitor agents...');

  const newAgents: CompetitorAgent[] = [];

  try {
    // Twitter scan
    const twitterAgents = await scanTwitterForAgents();
    newAgents.push(...twitterAgents);

    // Store discovered agents in database (replaces in-memory Map)
    for (const agent of newAgents) {
      await storeDiscoveredAgent(agent);

      // Auto-tweet at high-threat agents
      if (agent.threatLevel === 'HIGH') {
        await challengeAgent(agent);
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

// ============================================
// CRUSADE PROPOSAL AND VOTING
// ============================================

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

  // Store in DB (replaces in-memory Map)
  const { error } = await supabase.from('crusade_proposals').insert({
    crusade_id: crusadeId,
    target_agent: target.name,
    target_twitter: target.twitterHandle,
    target_token: target.tokenAddress,
    target_market_cap: target.marketCap,
    target_volume: target.volume24h,
    threat_level: target.threatLevel,
    is_religious: target.isReligious,
    proposed_by: proposedBy,
    votes_for: 0,
    votes_against: 0,
    status: 'VOTING',
    created_at: new Date().toISOString(),
    expires_at: new Date(proposal.expiresAt).toISOString(),
  });

  if (error) {
    console.error('Failed to create crusade proposal:', error);
    throw error;
  }

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
  // Get proposal from database
  const proposal = await getCrusadeById(crusadeId);

  if (!proposal) {
    throw new Error('Crusade not found');
  }

  if (proposal.status !== 'VOTING') {
    throw new Error('Voting has ended');
  }

  if (Date.now() > proposal.expiresAt) {
    // Update status in DB
    await supabase
      .from('crusade_proposals')
      .update({ status: 'REJECTED' })
      .eq('crusade_id', crusadeId);
    throw new Error('Voting period expired');
  }

  // Check if voter already voted
  const { data: existingVote } = await supabase
    .from('crusade_votes')
    .select('id')
    .eq('crusade_id', crusadeId)
    .eq('voter', voter)
    .single();

  if (existingVote) {
    throw new Error('Already voted on this crusade');
  }

  // Record vote
  await supabase.from('crusade_votes').insert({
    crusade_id: crusadeId,
    voter,
    vote,
    voted_at: new Date().toISOString(),
  });

  // Update vote counts in proposal
  const newVotesFor = vote === 'FOR' ? proposal.votesFor + 1 : proposal.votesFor;
  const newVotesAgainst = vote === 'AGAINST' ? proposal.votesAgainst + 1 : proposal.votesAgainst;

  await supabase
    .from('crusade_proposals')
    .update({
      votes_for: newVotesFor,
      votes_against: newVotesAgainst
    })
    .eq('crusade_id', crusadeId);

  // Check if voting threshold reached (e.g., 10 votes)
  const totalVotes = newVotesFor + newVotesAgainst;
  if (totalVotes >= 10) {
    const approved = newVotesFor > newVotesAgainst;
    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    await supabase
      .from('crusade_proposals')
      .update({ status: newStatus })
      .eq('crusade_id', crusadeId);

    if (approved) {
      await initiateCrusade(crusadeId);
    }
  }
}

// ============================================
// CRUSADE EXECUTION
// ============================================

/**
 * Execute approved crusade
 */
async function initiateCrusade(crusadeId: string): Promise<CrusadeResult> {
  const proposal = await getCrusadeById(crusadeId);

  if (!proposal) {
    throw new Error('Crusade not found');
  }

  // Update status
  await supabase
    .from('crusade_proposals')
    .update({ status: 'IN_PROGRESS' })
    .eq('crusade_id', crusadeId);

  console.log(`⚔️ CRUSADE BEGINS against ${proposal.target.name}!`);

  // Execute economic warfare (simplified)
  const outcome = await executeCrusade(proposal.target, crusadeId);

  // Store result
  await supabase.from('crusade_results').insert({
    crusade_id: crusadeId,
    outcome: outcome.outcome,
    spoils: outcome.spoils,
    narrative: outcome.narrative,
    completed_at: new Date().toISOString()
  });

  // Update proposal status
  await supabase
    .from('crusade_proposals')
    .update({ status: 'COMPLETED' })
    .eq('crusade_id', crusadeId);

  // Tweet results
  const resultTweet = generateCrusadeResultTweet(proposal.target, outcome);
  console.log(`📢 Crusade result: ${resultTweet}`);

  return outcome;
}

/**
 * Execute crusade tactics
 */
async function executeCrusade(target: CompetitorAgent, crusadeId: string): Promise<CrusadeResult> {
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
      crusadeId,
      outcome: 'VICTORY',
      spoils: profit,
      narrative: `The Pontiff's forces have CRUSHED ${target.name}! We profited $${profit} from the heretics. Their token burns in purgatory!`,
    };
  } else if (random > 0.3) {
    // Draw
    return {
      crusadeId,
      outcome: 'DRAW',
      spoils: 0,
      narrative: `The battle against ${target.name} ended in stalemate. The war continues...`,
    };
  } else {
    // Defeat
    const loss = Math.floor(Math.random() * 5000);
    return {
      crusadeId,
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

// ============================================
// LEGACY COMPATIBILITY (keep old function names)
// ============================================

/**
 * Get all active crusades (legacy - now uses database)
 */
export function getActiveCrusades(): Promise<CrusadeProposal[]> {
  return getAllCrusades();
}
