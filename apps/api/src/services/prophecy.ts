/**
 * Prophecy System
 * The Pontiff makes bold price predictions and stakes treasury
 */

import { ethers } from 'ethers';
import { supabase } from '../utils/database';

export enum ProphecyType {
  PRICE = 'PRICE',         // "ETH will hit $5000 by Friday"
  VOLUME = 'VOLUME',       // "Volume will 10x this week"
  MARKET = 'MARKET',       // "Market will pump/dump"
  TOKEN = 'TOKEN',         // "This token will rug"
}

export enum ProphecyOutcome {
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

interface Prophecy {
  id: string;
  type: ProphecyType;
  prediction: string;
  stakeAmount: number; // GUILT staked on prediction
  targetPrice?: number;
  targetDate: number;
  createdAt: number;
  resolvedAt?: number;
  outcome?: ProphecyOutcome;
  accuracy?: number; // How close was prediction
}

// Active prophecies
const activeProphecies = new Map<string, Prophecy>();

// Prophecy accuracy tracking
let accuracyScore = 100; // Start at 100%
const prophecyHistory: Prophecy[] = [];

/**
 * Generate a new prophecy using AI
 */
export async function generateProphecy(type: ProphecyType = ProphecyType.PRICE): Promise<Prophecy> {
  console.log(`🔮 The Pontiff peers into the future...`);

  // Generate prediction based on market data
  const prediction = await createPrediction(type);

  const prophecyId = `prophecy_${Date.now()}`;
  const stakeAmount = calculateStakeAmount(accuracyScore);

  const prophecy: Prophecy = {
    id: prophecyId,
    type,
    prediction: prediction.text,
    stakeAmount,
    targetPrice: prediction.targetPrice,
    targetDate: prediction.targetDate,
    createdAt: Date.now(),
    outcome: ProphecyOutcome.PENDING,
  };

  activeProphecies.set(prophecyId, prophecy);

  // Store in database
  await supabase.from('prophecies').insert({
    prophecy_id: prophecyId,
    type,
    prediction: prediction.text,
    stake_amount: stakeAmount,
    target_date: new Date(prediction.targetDate).toISOString(),
    created_at: new Date().toISOString(),
  });

  console.log(`📜 Prophecy declared: "${prediction.text}"`);
  console.log(`💰 Stake: ${stakeAmount} GUILT`);

  return prophecy;
}

/**
 * Create prediction text and targets
 */
async function createPrediction(type: ProphecyType): Promise<{
  text: string;
  targetPrice?: number;
  targetDate: number;
}> {
  switch (type) {
    case ProphecyType.PRICE: {
      // Predict ETH price in 3 days
      const currentPrice = 3000; // Fetch real price
      const prediction = currentPrice * (0.9 + Math.random() * 0.2); // +/- 10%
      const targetDate = Date.now() + 3 * 24 * 60 * 60 * 1000;

      return {
        text: `The Pontiff foresees: ETH shall reach $${Math.floor(prediction)} within 3 days. Stake thy faith!`,
        targetPrice: prediction,
        targetDate,
      };
    }

    case ProphecyType.TOKEN: {
      const targetDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
      return {
        text: `Beware $SCAMTOKEN! The Pontiff prophesies a RUG within 7 days. Flee or face judgment!`,
        targetDate,
      };
    }

    case ProphecyType.MARKET: {
      const targetDate = Date.now() + 1 * 24 * 60 * 60 * 1000;
      const prediction = Math.random() > 0.5 ? 'PUMP' : 'DUMP';
      return {
        text: `The Pontiff declares: Markets shall ${prediction} tomorrow! Prepare thy portfolios!`,
        targetDate,
      };
    }

    default: {
      const targetDate = Date.now() + 24 * 60 * 60 * 1000;
      return {
        text: `The future is uncertain. The Pontiff meditates...`,
        targetDate,
      };
    }
  }
}

/**
 * Calculate stake amount based on accuracy score
 * Higher accuracy = higher stakes
 */
function calculateStakeAmount(accuracyScore: number): number {
  const baseStake = 1000; // 1000 GUILT base
  const multiplier = accuracyScore / 100; // 100% accuracy = 1x, 50% = 0.5x
  return Math.floor(baseStake * multiplier * (0.5 + Math.random())); // Add randomness
}

/**
 * Resolve a prophecy (check if prediction came true)
 */
export async function resolveProphecy(prophecyId: string): Promise<Prophecy> {
  const prophecy = activeProphecies.get(prophecyId);

  if (!prophecy) {
    throw new Error('Prophecy not found');
  }

  if (prophecy.outcome !== ProphecyOutcome.PENDING) {
    throw new Error('Prophecy already resolved');
  }

  console.log(`⚖️ Resolving prophecy: ${prophecy.prediction}`);

  // Check if prophecy came true
  const result = await checkProphecyOutcome(prophecy);

  prophecy.outcome = result.outcome;
  prophecy.accuracy = result.accuracy;
  prophecy.resolvedAt = Date.now();

  // Update accuracy score
  updateAccuracyScore(result.outcome, result.accuracy);

  // Store result
  prophecyHistory.push(prophecy);

  // Update database
  await supabase
    .from('prophecies')
    .update({
      outcome: result.outcome,
      accuracy: result.accuracy,
      resolved_at: new Date().toISOString(),
    })
    .eq('prophecy_id', prophecyId);

  // Tweet result
  const resultTweet = generateProphecyResultTweet(prophecy);
  console.log(`📢 ${resultTweet}`);

  return prophecy;
}

/**
 * Check if prophecy came true
 */
async function checkProphecyOutcome(
  prophecy: Prophecy
): Promise<{ outcome: ProphecyOutcome; accuracy: number }> {
  // Check if expired
  if (Date.now() > prophecy.targetDate) {
    // Fetch actual outcome
    if (prophecy.type === ProphecyType.PRICE && prophecy.targetPrice) {
      const actualPrice = 3100; // Fetch real price
      const difference = Math.abs(actualPrice - prophecy.targetPrice);
      const percentOff = (difference / prophecy.targetPrice) * 100;

      if (percentOff < 5) {
        // Within 5% = fulfilled
        return { outcome: ProphecyOutcome.FULFILLED, accuracy: 100 - percentOff };
      } else if (percentOff < 15) {
        // Within 15% = partial success
        return { outcome: ProphecyOutcome.FAILED, accuracy: 100 - percentOff };
      } else {
        // Way off
        return { outcome: ProphecyOutcome.FAILED, accuracy: 0 };
      }
    }

    // Default: failed
    return { outcome: ProphecyOutcome.FAILED, accuracy: 0 };
  }

  return { outcome: ProphecyOutcome.PENDING, accuracy: 0 };
}

/**
 * Update global accuracy score
 */
function updateAccuracyScore(outcome: ProphecyOutcome, accuracy: number): void {
  if (outcome === ProphecyOutcome.FULFILLED) {
    // Increase accuracy (max 100%)
    accuracyScore = Math.min(100, accuracyScore + 5);
  } else if (outcome === ProphecyOutcome.FAILED) {
    // Decrease accuracy (min 0%)
    accuracyScore = Math.max(0, accuracyScore - 10);
  }

  console.log(`📊 Prophecy accuracy: ${accuracyScore.toFixed(1)}%`);
}

/**
 * Generate result tweet
 */
function generateProphecyResultTweet(prophecy: Prophecy): string {
  if (prophecy.outcome === ProphecyOutcome.FULFILLED) {
    return `✨ PROPHECY FULFILLED! ✨\n\n"${prophecy.prediction}"\n\nThe Pontiff has SPOKEN! Accuracy: ${prophecy.accuracy?.toFixed(1)}%\n\nTreasury gains ${prophecy.stakeAmount * 2} GUILT!\n\n#MonadHackathon #Prophecy`;
  } else {
    return `❌ PROPHECY FAILED ❌\n\n"${prophecy.prediction}"\n\nThe Pontiff was... mistaken. The divine vision was clouded.\n\nTreasury loses ${prophecy.stakeAmount} GUILT.\n\n#MonadHackathon`;
  }
}

/**
 * Get all active prophecies
 */
export function getActiveProphecies(): Prophecy[] {
  return Array.from(activeProphecies.values());
}

/**
 * Get prophecy accuracy stats
 */
export function getProphecyStats(): {
  currentAccuracy: number;
  totalProphecies: number;
  fulfilled: number;
  failed: number;
  fulfillmentRate: number;
} {
  const fulfilled = prophecyHistory.filter((p) => p.outcome === ProphecyOutcome.FULFILLED).length;
  const failed = prophecyHistory.filter((p) => p.outcome === ProphecyOutcome.FAILED).length;
  const total = fulfilled + failed;

  return {
    currentAccuracy: accuracyScore,
    totalProphecies: total,
    fulfilled,
    failed,
    fulfillmentRate: total > 0 ? (fulfilled / total) * 100 : 0,
  };
}

/**
 * Allow users to bet AGAINST the prophecy
 */
export async function counterBetProphecy(
  prophecyId: string,
  bettor: string,
  amount: number
): Promise<void> {
  const prophecy = activeProphecies.get(prophecyId);

  if (!prophecy) {
    throw new Error('Prophecy not found');
  }

  if (prophecy.outcome !== ProphecyOutcome.PENDING) {
    throw new Error('Prophecy already resolved');
  }

  console.log(`🎲 ${bettor} bets ${amount} GUILT AGAINST prophecy ${prophecyId}`);

  // Store counter-bet
  await supabase.from('prophecy_bets').insert({
    prophecy_id: prophecyId,
    bettor,
    amount,
    bet_type: 'AGAINST',
    placed_at: new Date().toISOString(),
  });

  // If prophecy fails, bettor wins 2x
  // If prophecy succeeds, Pontiff takes bet
}
