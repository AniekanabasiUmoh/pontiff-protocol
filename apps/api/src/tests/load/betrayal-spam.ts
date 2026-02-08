/**
 * Load Testing: Betrayal Spam Test
 *
 * Simulates 1,000 betrayal transactions in 1 minute to test:
 * - RPC stability under load
 * - WebSocket event broadcasting
 * - Dashboard UI updates
 * - Database write performance
 *
 * USAGE:
 *   npx ts-node src/tests/load/betrayal-spam.ts
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const CONFIG = {
  RPC_URL: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  JUDAS_CONTRACT: process.env.NEXT_PUBLIC_JUDAS_ADDRESS || '',
  PRIVATE_KEYS: [
    // Add test wallet private keys here (use testnet wallets with no real funds)
    process.env.TEST_WALLET_1_PK || '',
    process.env.TEST_WALLET_2_PK || '',
    process.env.TEST_WALLET_3_PK || '',
  ].filter(Boolean),
  TARGET_TX_COUNT: 1000,
  DURATION_MS: 60000, // 1 minute
  BATCH_SIZE: 50, // Send 50 txs at once
};

// Judas Protocol ABI (minimal)
const JUDAS_ABI = [
  'function signalBetrayal() external',
  'function deposit(uint256 amount) external',
  'function getCurrentEpoch() external view returns (uint256)',
];

interface LoadTestResult {
  totalTxAttempted: number;
  totalTxSuccess: number;
  totalTxFailed: number;
  avgGasPrice: string;
  avgTxTime: number;
  rpcErrors: number;
  startTime: number;
  endTime: number;
}

/**
 * Main load test function
 */
async function runBetrayalLoadTest(): Promise<LoadTestResult> {
  console.log('🔥 STARTING BETRAYAL LOAD TEST 🔥\n');
  console.log(`Target: ${CONFIG.TARGET_TX_COUNT} transactions in ${CONFIG.DURATION_MS / 1000}s`);
  console.log(`Batch Size: ${CONFIG.BATCH_SIZE}`);
  console.log(`Wallets: ${CONFIG.PRIVATE_KEYS.length}\n`);

  if (CONFIG.PRIVATE_KEYS.length === 0) {
    throw new Error('No test wallets configured. Add TEST_WALLET_X_PK to .env');
  }

  if (!CONFIG.JUDAS_CONTRACT) {
    throw new Error('NEXT_PUBLIC_JUDAS_ADDRESS not set in .env');
  }

  const results: LoadTestResult = {
    totalTxAttempted: 0,
    totalTxSuccess: 0,
    totalTxFailed: 0,
    avgGasPrice: '0',
    avgTxTime: 0,
    rpcErrors: 0,
    startTime: Date.now(),
    endTime: 0,
  };

  // Setup providers and signers
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const signers = CONFIG.PRIVATE_KEYS.map((pk) => new ethers.Wallet(pk, provider));

  // Create contract instances
  const contracts = signers.map((signer) => new ethers.Contract(CONFIG.JUDAS_CONTRACT, JUDAS_ABI, signer));

  // Track transaction times
  const txTimes: number[] = [];
  const gasPrices: bigint[] = [];

  // Calculate delay between batches
  const totalBatches = Math.ceil(CONFIG.TARGET_TX_COUNT / CONFIG.BATCH_SIZE);
  const delayBetweenBatches = CONFIG.DURATION_MS / totalBatches;

  console.log(`📊 Sending ${totalBatches} batches with ${delayBetweenBatches.toFixed(0)}ms delay\n`);

  // Send transactions in batches
  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = Date.now();
    const promises: Promise<void>[] = [];

    // Send batch of transactions
    for (let i = 0; i < CONFIG.BATCH_SIZE && results.totalTxAttempted < CONFIG.TARGET_TX_COUNT; i++) {
      const walletIndex = results.totalTxAttempted % signers.length;
      const contract = contracts[walletIndex];
      results.totalTxAttempted++;

      // Create promise for this transaction
      const txPromise = (async () => {
        const txStart = Date.now();
        try {
          const tx = await contract.signalBetrayal();
          const receipt = await tx.wait();

          const txTime = Date.now() - txStart;
          txTimes.push(txTime);

          if (receipt && receipt.gasPrice) {
            gasPrices.push(receipt.gasPrice);
          }

          results.totalTxSuccess++;
          process.stdout.write(`✅ ${results.totalTxSuccess} `);
        } catch (error: any) {
          results.totalTxFailed++;

          if (error.message?.includes('RPC') || error.message?.includes('network')) {
            results.rpcErrors++;
          }

          process.stdout.write(`❌ ${results.totalTxFailed} `);
        }
      })();

      promises.push(txPromise);
    }

    // Wait for all transactions in this batch
    await Promise.allSettled(promises);

    console.log(`\nBatch ${batch + 1}/${totalBatches} complete`);

    // Wait before next batch (maintain rate limiting)
    const batchTime = Date.now() - batchStart;
    const waitTime = Math.max(0, delayBetweenBatches - batchTime);
    if (waitTime > 0 && batch < totalBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  results.endTime = Date.now();

  // Calculate averages
  if (txTimes.length > 0) {
    results.avgTxTime = txTimes.reduce((a, b) => a + b, 0) / txTimes.length;
  }

  if (gasPrices.length > 0) {
    const totalGas = gasPrices.reduce((a, b) => a + b, 0n);
    results.avgGasPrice = ethers.formatUnits(totalGas / BigInt(gasPrices.length), 'gwei');
  }

  return results;
}

/**
 * Display results
 */
function displayResults(results: LoadTestResult): void {
  console.log('\n\n📊 ====== LOAD TEST RESULTS ======\n');

  const durationSeconds = (results.endTime - results.startTime) / 1000;
  const successRate = (results.totalTxSuccess / results.totalTxAttempted) * 100;
  const txPerSecond = results.totalTxSuccess / durationSeconds;

  console.log(`Total Attempted:     ${results.totalTxAttempted}`);
  console.log(`Total Success:       ${results.totalTxSuccess} (${successRate.toFixed(1)}%)`);
  console.log(`Total Failed:        ${results.totalTxFailed}`);
  console.log(`RPC Errors:          ${results.rpcErrors}`);
  console.log(`\nPerformance:`);
  console.log(`Duration:            ${durationSeconds.toFixed(2)}s`);
  console.log(`Throughput:          ${txPerSecond.toFixed(2)} tx/s`);
  console.log(`Avg TX Time:         ${results.avgTxTime.toFixed(0)}ms`);
  console.log(`Avg Gas Price:       ${results.avgGasPrice} gwei`);

  console.log('\n\n✅ Test Assessment:');
  if (successRate >= 95) {
    console.log('🟢 EXCELLENT: System handled load gracefully');
  } else if (successRate >= 80) {
    console.log('🟡 GOOD: Minor issues under load, acceptable');
  } else if (successRate >= 50) {
    console.log('🟠 WARNING: Significant failures, investigate RPC/contract');
  } else {
    console.log('🔴 CRITICAL: System failure under load, do not deploy');
  }

  if (results.rpcErrors > results.totalTxFailed * 0.5) {
    console.log('⚠️  Most failures are RPC-related. Check Monad RPC stability.');
  }

  console.log('\n====================================\n');
}

/**
 * Run the test
 */
if (require.main === module) {
  runBetrayalLoadTest()
    .then(displayResults)
    .catch((error) => {
      console.error('\n❌ Load test failed:', error);
      process.exit(1);
    });
}

export { runBetrayalLoadTest, LoadTestResult };
