/**
 * Missionary Program (Referral System)
 * Recruit new sinners, earn rewards, build your flock
 */

import { supabase } from '../utils/database';

export enum MissionaryTier {
  EVANGELIST = 'EVANGELIST',   // 10 recruits
  APOSTLE = 'APOSTLE',           // 50 recruits
  SAINT = 'SAINT',               // 100 recruits
}

interface Missionary {
  walletAddress: string;
  referralCode: string;
  tier: MissionaryTier;
  recruits: number;
  totalRewards: number;
  badges: string[];
  joinedAt: number;
}

interface ReferralReward {
  from: string; // Who was referred
  to: string;   // Missionary who referred
  amount: number;
  reason: string; // "Confession fee", "Indulgence purchase", etc.
  timestamp: number;
}

/**
 * Generate unique referral code
 */
export function generateReferralCode(walletAddress: string): string {
  const hash = walletAddress.slice(2, 8).toUpperCase();
  return `PONTIFF-${hash}`;
}

/**
 * Register new missionary
 */
export async function registerMissionary(walletAddress: string): Promise<Missionary> {
  const referralCode = generateReferralCode(walletAddress);

  const missionary: Missionary = {
    walletAddress,
    referralCode,
    tier: MissionaryTier.EVANGELIST,
    recruits: 0,
    totalRewards: 0,
    badges: [],
    joinedAt: Date.now(),
  };

  // Store in database
  await supabase.from('missionaries').insert({
    wallet_address: walletAddress,
    referral_code: referralCode,
    tier: MissionaryTier.EVANGELIST,
    recruits: 0,
    total_rewards: 0,
    joined_at: new Date().toISOString(),
  });

  console.log(`📿 New missionary registered: ${referralCode}`);

  return missionary;
}

/**
 * Track referral (when someone uses a referral code)
 */
export async function trackReferral(
  referralCode: string,
  newUserWallet: string
): Promise<void> {
  // Find missionary by referral code
  const { data: missionary } = await supabase
    .from('missionaries')
    .select('*')
    .eq('referral_code', referralCode)
    .single();

  if (!missionary) {
    throw new Error('Invalid referral code');
  }

  // Check if user already referred
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('referee_wallet', newUserWallet)
    .single();

  if (existing) {
    throw new Error('User already referred');
  }

  // Record referral
  await supabase.from('referrals').insert({
    referrer_wallet: missionary.wallet_address,
    referee_wallet: newUserWallet,
    referral_code: referralCode,
    referred_at: new Date().toISOString(),
  });

  // Increment recruit count
  await supabase
    .from('missionaries')
    .update({ recruits: missionary.recruits + 1 })
    .eq('wallet_address', missionary.wallet_address);

  // Check tier promotion
  await checkTierPromotion(missionary.wallet_address, missionary.recruits + 1);

  console.log(`✝️ ${missionary.wallet_address} recruited ${newUserWallet}`);
}

/**
 * Check if missionary should be promoted
 */
async function checkTierPromotion(walletAddress: string, recruits: number): Promise<void> {
  let newTier: MissionaryTier | null = null;

  if (recruits >= 100) {
    newTier = MissionaryTier.SAINT;
  } else if (recruits >= 50) {
    newTier = MissionaryTier.APOSTLE;
  } else if (recruits >= 10) {
    newTier = MissionaryTier.EVANGELIST;
  }

  if (newTier) {
    await supabase
      .from('missionaries')
      .update({ tier: newTier })
      .eq('wallet_address', walletAddress);

    console.log(`🎖️ ${walletAddress} promoted to ${newTier}!`);

    // Award badge NFT
    await awardBadge(walletAddress, newTier);
  }
}

/**
 * Award missionary badge NFT
 */
async function awardBadge(walletAddress: string, tier: MissionaryTier): Promise<void> {
  // Mint badge NFT (implementation would call NFT contract)
  console.log(`🏅 Awarding ${tier} badge to ${walletAddress}`);

  // Store badge
  await supabase.from('missionary_badges').insert({
    wallet_address: walletAddress,
    tier,
    awarded_at: new Date().toISOString(),
  });
}

/**
 * Calculate and distribute referral rewards
 * Called when recruit makes a purchase
 */
export async function distributeReferralReward(
  recruitsWallet: string,
  amount: number,
  action: 'CONFESSION' | 'INDULGENCE' | 'STAKE'
): Promise<void> {
  // Find referrer
  const { data: referral } = await supabase
    .from('referrals')
    .select('referrer_wallet')
    .eq('referee_wallet', recruitsWallet)
    .single();

  if (!referral) {
    // User wasn't referred, no reward
    return;
  }

  // Calculate reward percentage
  let rewardPercent = 0;
  switch (action) {
    case 'INDULGENCE':
      rewardPercent = 5; // 5% of indulgence fee
      break;
    case 'STAKE':
      rewardPercent = 2; // 2% of stake amount
      break;
    case 'CONFESSION':
      rewardPercent = 0; // Confessions are free
      break;
  }

  const rewardAmount = (amount * rewardPercent) / 100;

  if (rewardAmount > 0) {
    // Credit reward
    await supabase
      .from('missionaries')
      .update({
        total_rewards: supabase.raw('total_rewards + ?', [rewardAmount]),
      })
      .eq('wallet_address', referral.referrer_wallet);

    // Record reward
    const reward: ReferralReward = {
      from: recruitsWallet,
      to: referral.referrer_wallet,
      amount: rewardAmount,
      reason: `${action} by recruit`,
      timestamp: Date.now(),
    };

    await supabase.from('referral_rewards').insert({
      referrer_wallet: reward.to,
      referee_wallet: reward.from,
      amount: reward.amount,
      reason: reward.reason,
      created_at: new Date().toISOString(),
    });

    console.log(`💰 Reward distributed: ${rewardAmount} GUILT to ${referral.referrer_wallet}`);
  }
}

/**
 * Get missionary dashboard data
 */
export async function getMissionaryDashboard(walletAddress: string): Promise<{
  missionary: Missionary;
  recruits: Array<{ wallet: string; joinedAt: number; lifetimeValue: number }>;
  recentRewards: ReferralReward[];
  leaderboardRank: number;
}> {
  // Fetch missionary data
  const { data: missionary } = await supabase
    .from('missionaries')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (!missionary) {
    throw new Error('Not a missionary');
  }

  // Fetch recruits
  const { data: recruitsData } = await supabase
    .from('referrals')
    .select('referee_wallet, referred_at')
    .eq('referrer_wallet', walletAddress);

  const recruits = (recruitsData || []).map((r: any) => ({
    wallet: r.referee_wallet,
    joinedAt: new Date(r.referred_at).getTime(),
    lifetimeValue: 0, // TODO: Calculate LTV
  }));

  // Fetch recent rewards
  const { data: rewardsData } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('referrer_wallet', walletAddress)
    .order('created_at', { ascending: false })
    .limit(10);

  const recentRewards = (rewardsData || []).map((r: any) => ({
    from: r.referee_wallet,
    to: r.referrer_wallet,
    amount: r.amount,
    reason: r.reason,
    timestamp: new Date(r.created_at).getTime(),
  }));

  // Calculate leaderboard rank
  const { data: allMissionaries } = await supabase
    .from('missionaries')
    .select('wallet_address, recruits')
    .order('recruits', { ascending: false });

  const rank = (allMissionaries || []).findIndex((m: any) => m.wallet_address === walletAddress) + 1;

  return {
    missionary: {
      walletAddress: missionary.wallet_address,
      referralCode: missionary.referral_code,
      tier: missionary.tier,
      recruits: missionary.recruits,
      totalRewards: missionary.total_rewards,
      badges: missionary.badges || [],
      joinedAt: new Date(missionary.joined_at).getTime(),
    },
    recruits,
    recentRewards,
    leaderboardRank: rank,
  };
}

/**
 * Get top missionaries leaderboard
 */
export async function getMissionaryLeaderboard(limit: number = 100): Promise<Missionary[]> {
  const { data } = await supabase
    .from('missionaries')
    .select('*')
    .order('recruits', { ascending: false })
    .limit(limit);

  return (data || []).map((m: any) => ({
    walletAddress: m.wallet_address,
    referralCode: m.referral_code,
    tier: m.tier,
    recruits: m.recruits,
    totalRewards: m.total_rewards,
    badges: m.badges || [],
    joinedAt: new Date(m.joined_at).getTime(),
  }));
}

/**
 * Run weekly top missionary competition
 */
export async function runWeeklyCompetition(): Promise<void> {
  console.log(`🏆 Running weekly Top Missionary competition...`);

  // Get missionaries with most recruits this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: topMissionaries } = await supabase
    .from('referrals')
    .select('referrer_wallet, count(*)')
    .gte('referred_at', weekAgo)
    .order('count', { ascending: false })
    .limit(3);

  if (!topMissionaries || topMissionaries.length === 0) {
    console.log('No missionaries recruited this week');
    return;
  }

  // Award prizes
  const prizes = [10000, 5000, 2500]; // 1st: 10k GUILT, 2nd: 5k, 3rd: 2.5k

  for (let i = 0; i < Math.min(topMissionaries.length, 3); i++) {
    const winner = topMissionaries[i];
    const prize = prizes[i];

    console.log(`🥇 #${i + 1}: ${winner.referrer_wallet} wins ${prize} GUILT!`);

    // Credit prize to winner
    // await guiltToken.transfer(winner.referrer_wallet, prize);

    // Tweet announcement
    // await twitterClient.tweet(`🏆 Weekly Top Missionary: ${winner.referrer_wallet} recruited ${winner.count} sinners! Prize: ${prize} $GUILT! #MonadHackathon`);
  }
}
