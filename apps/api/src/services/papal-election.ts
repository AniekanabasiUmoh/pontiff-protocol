/**
 * Papal Election & Schism System
 * Dynamic AI personality switching and governance drama
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Pope personalities
export enum PopePersonality {
  ZEALOT = 'ZEALOT',
  MERCHANT = 'MERCHANT',
  HERETIC = 'HERETIC',
}

interface PopeConfig {
  personality: PopePersonality;
  systemPrompt: string;
  traits: string[];
  electedAt: number;
  termEnds: number;
}

interface ElectionResult {
  winner: PopePersonality;
  votesFor: Map<PopePersonality, number>;
  totalVotes: number;
  margin: number; // % difference
  timestamp: number;
}

// Current Pope
let currentPope: PopeConfig = {
  personality: PopePersonality.ZEALOT,
  systemPrompt: buildSystemPrompt(PopePersonality.ZEALOT),
  traits: ['Strict', 'Traditional', 'Unforgiving'],
  electedAt: Date.now(),
  termEnds: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30-day term
};

/**
 * Build system prompt for each personality
 */
function buildSystemPrompt(personality: PopePersonality): string {
  const base = `You are The Pontiff, supreme judge of crypto degeneracy on Monad blockchain.
Your role is to roast sinners (traders who lost money) with medieval religious language mixed with crypto slang.
Keep roasts under 250 characters for Twitter.`;

  switch (personality) {
    case PopePersonality.ZEALOT:
      return `${base}

PERSONALITY: THE ZEALOT
- Extremely strict and unforgiving
- Heavy biblical references and fire & brimstone
- Demands absolute repentance
- Calls for public confession and penance
- Zero tolerance for sin
- Archaic language: "thee", "thou", "hath", "thy wickedness"

Examples:
- "Thou hast sinned grievously! Thy rugged tokens burn in eternal hellfire! Repent or face EXCOMMUNICATION!"
- "The scales of judgment weigh heavy against thee! $500 lost to paper hands! CONFESSION IS MANDATORY!"`;

    case PopePersonality.MERCHANT:
      return `${base}

PERSONALITY: THE MERCHANT
- Pragmatic and financially focused
- Views everything through profit/loss lens
- Willing to forgive... for a price
- Transactional language
- Still maintains religious authority but more business-like

Examples:
- "Thy portfolio bleeds red. For the modest sum of 100 $GUILT, absolution may be thine."
- "A wise trader learns from losses. Purchase divine wisdom at the Cathedral shop!"`;

    case PopePersonality.HERETIC:
      return `${base}

PERSONALITY: THE HERETIC
- Rebellious and chaotic
- Questions tradition, embraces degeneracy
- Celebrates risk-taking (even failed ones)
- Encourages MORE chaos
- Still roasts but with admiration for boldness

Examples:
- "Thou aped into a rug with ZERO research? BASED. Thy recklessness is admirable, if foolish!"
- "Paper hands? NAY! Call it strategic repositioning! The Heretic Pope forgives thy cowardice!"`;

    default:
      return base;
  }
}

/**
 * Get current Pope configuration
 */
export function getCurrentPope(): PopeConfig {
  return { ...currentPope };
}

/**
 * Get all Pope personalities for election
 */
export function getAllPersonalities(): Array<{ id: PopePersonality; name: string; description: string }> {
  return [
    {
      id: PopePersonality.ZEALOT,
      name: 'The Zealot',
      description: 'Strict, unforgiving, demands absolute repentance',
    },
    {
      id: PopePersonality.MERCHANT,
      name: 'The Merchant',
      description: 'Pragmatic, transactional, forgiveness has a price',
    },
    {
      id: PopePersonality.HERETIC,
      name: 'The Heretic',
      description: 'Rebellious, chaotic, celebrates bold (reckless) moves',
    },
  ];
}

/**
 * Propose a vote of no confidence (Cardinals only)
 */
export async function proposeVoteOfNoConfidence(proposer: string, reason: string): Promise<string> {
  console.log(`⚖️ Vote of No Confidence proposed by ${proposer}`);
  console.log(`Reason: ${reason}`);

  // Create voting period (24 hours)
  const voteId = `vote_${Date.now()}`;

  // Store in database
  // await supabase.from('papal_votes').insert({ vote_id: voteId, proposer, reason, ... })

  return voteId;
}

/**
 * Cardinals cast votes
 */
const voteRecords = new Map<
  string,
  { personality: PopePersonality; votes: number; voters: Set<string> }
>();

export async function castElectionVote(
  voteId: string,
  voter: string,
  choice: PopePersonality
): Promise<void> {
  // Check if voter is Cardinal (has sufficient stake)
  // const isCardinal = await checkCardinalStatus(voter);
  // if (!isCardinal) throw new Error('Only Cardinals can vote');

  const record = voteRecords.get(voteId) || {
    personality: choice,
    votes: 0,
    voters: new Set(),
  };

  if (record.voters.has(voter)) {
    throw new Error('Already voted');
  }

  record.votes++;
  record.voters.add(voter);
  voteRecords.set(voteId, record);

  console.log(`🗳️ ${voter} voted for ${choice}`);
}

/**
 * Execute papal election and switch personality
 */
export async function executePapalElection(voteId: string): Promise<ElectionResult> {
  console.log(`⚖️ EXECUTING PAPAL ELECTION...`);

  // Tally votes
  const voteCounts = new Map<PopePersonality, number>();
  for (const [_, record] of voteRecords) {
    const current = voteCounts.get(record.personality) || 0;
    voteCounts.set(record.personality, current + record.votes);
  }

  // Find winner
  let winner = PopePersonality.ZEALOT;
  let maxVotes = 0;
  for (const [personality, votes] of voteCounts) {
    if (votes > maxVotes) {
      maxVotes = votes;
      winner = personality;
    }
  }

  const totalVotes = Array.from(voteCounts.values()).reduce((a, b) => a + b, 0);

  // Calculate margin
  const sortedVotes = Array.from(voteCounts.entries()).sort((a, b) => b[1] - a[1]);
  const margin = sortedVotes.length > 1 ? ((sortedVotes[0][1] - sortedVotes[1][1]) / totalVotes) * 100 : 100;

  const result: ElectionResult = {
    winner,
    votesFor: voteCounts,
    totalVotes,
    margin,
    timestamp: Date.now(),
  };

  // Switch Pope personality
  await switchPope(winner, result);

  // Check for schism (if margin < 10%)
  if (margin < 10) {
    await triggerSchism(sortedVotes[0][0], sortedVotes[1][0]);
  }

  return result;
}

/**
 * Switch Pope personality
 */
async function switchPope(newPersonality: PopePersonality, result: ElectionResult): Promise<void> {
  console.log(`\n👑 NEW POPE ELECTED: ${newPersonality} 👑\n`);

  currentPope = {
    personality: newPersonality,
    systemPrompt: buildSystemPrompt(newPersonality),
    traits: getPersonalityTraits(newPersonality),
    electedAt: Date.now(),
    termEnds: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30-day term
  };

  // Tweet announcement
  const announcement = generateElectionTweet(result);
  console.log(`📢 ${announcement}`);
  // await twitterClient.tweet(announcement);
}

/**
 * Trigger schism (close election)
 */
async function triggerSchism(pope: PopePersonality, antipope: PopePersonality): Promise<void> {
  console.log(`\n⚠️ SCHISM TRIGGERED! ⚠️\n`);
  console.log(`Pope: ${pope} vs Antipope: ${antipope}`);

  // Split treasury 70/30
  // Create new wallet for Antipope
  // Launch $ANTIPOPE token
  // Enable pope vs antipope debate mode

  const schismTweet = `🔥 SCHISM! 🔥\n\nThe Church has SPLIT!\n\nPope ${pope} holds the Vatican.\nAntipope ${antipope} rebels from Avignon!\n\nTwo leaders! Two visions! ONE BLOCKCHAIN!\n\n#MonadHackathon #Schism`;

  console.log(`📢 ${schismTweet}`);
}

/**
 * Get personality traits
 */
function getPersonalityTraits(personality: PopePersonality): string[] {
  switch (personality) {
    case PopePersonality.ZEALOT:
      return ['Strict', 'Unforgiving', 'Traditional', 'Fire & Brimstone'];
    case PopePersonality.MERCHANT:
      return ['Pragmatic', 'Transactional', 'Business-minded', 'Flexible'];
    case PopePersonality.HERETIC:
      return ['Rebellious', 'Chaotic', 'Risk-embracing', 'Unconventional'];
  }
}

/**
 * Generate election result tweet
 */
function generateElectionTweet(result: ElectionResult): string {
  const { winner, votesFor, totalVotes, margin } = result;

  const voteBreakdown = Array.from(votesFor.entries())
    .map(([p, v]) => `${p}: ${v} votes (${((v / totalVotes) * 100).toFixed(1)}%)`)
    .join('\n');

  return `👑 HABEMUS PAPAM! 👑\n\nA new Pope has been elected!\n\n${winner} WINS with ${margin.toFixed(1)}% margin!\n\nVote Breakdown:\n${voteBreakdown}\n\nThe new era begins NOW! #MonadHackathon #PapalElection`;
}

/**
 * Get roast with current Pope personality
 */
export async function getRoastWithPersonality(sinData: any): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${currentPope.systemPrompt}\n\nSinner data:\n${JSON.stringify(sinData)}\n\nGenerate a roast (under 250 chars):`;

  try {
    const result = await model.generateContent(prompt);
    const roast = result.response.text();
    return roast.slice(0, 250);
  } catch (error) {
    console.error('Roast generation failed:', error);
    return 'Thy sins are numerous! Seek forgiveness!';
  }
}
