/**
 * API Load Testing: Confession Endpoint Stress Test
 *
 * Tests the /api/confess endpoint under heavy load:
 * - 500 concurrent requests
 * - Tests scanner, roaster, image generator, DB writes
 * - Measures response times and error rates
 *
 * USAGE:
 *   npx ts-node src/tests/load/api-stress.ts
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TARGET_REQUESTS: 500,
  CONCURRENT_BATCH: 50, // Send 50 requests at once
  TEST_WALLETS: [
    // Sample Monad testnet addresses for testing
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x9876543210987654321098765432109876543210',
  ],
};

interface APILoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  errorTypes: Record<string, number>;
  startTime: number;
  endTime: number;
}

/**
 * Send a single confession request
 */
async function sendConfessionRequest(walletAddress: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const start = Date.now();

  try {
    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/api/confess`,
      { walletAddress },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30s timeout
      }
    );

    const responseTime = Date.now() - start;

    if (response.status === 200 && response.data.confessionId) {
      return { success: true, responseTime };
    }

    return { success: false, responseTime, error: 'Invalid response format' };
  } catch (error: any) {
    const responseTime = Date.now() - start;

    if (error.code === 'ECONNABORTED') {
      return { success: false, responseTime, error: 'Timeout' };
    }

    if (error.response) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${error.response.status}: ${error.response.data?.error || 'Unknown'}`,
      };
    }

    return { success: false, responseTime, error: error.message || 'Unknown error' };
  }
}

/**
 * Run API load test
 */
async function runAPILoadTest(): Promise<APILoadTestResult> {
  console.log('🚀 STARTING API LOAD TEST 🚀\n');
  console.log(`Target: ${CONFIG.TARGET_REQUESTS} requests`);
  console.log(`Batch Size: ${CONFIG.CONCURRENT_BATCH}`);
  console.log(`API: ${CONFIG.API_BASE_URL}\n`);

  const results: APILoadTestResult = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    p95ResponseTime: 0,
    errorTypes: {},
    startTime: Date.now(),
    endTime: 0,
  };

  const responseTimes: number[] = [];
  const totalBatches = Math.ceil(CONFIG.TARGET_REQUESTS / CONFIG.CONCURRENT_BATCH);

  // Send requests in batches
  for (let batch = 0; batch < totalBatches; batch++) {
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < CONFIG.CONCURRENT_BATCH && results.totalRequests < CONFIG.TARGET_REQUESTS; i++) {
      const walletIndex = results.totalRequests % CONFIG.TEST_WALLETS.length;
      const wallet = CONFIG.TEST_WALLETS[walletIndex];
      results.totalRequests++;

      const requestPromise = (async () => {
        const result = await sendConfessionRequest(wallet);

        responseTimes.push(result.responseTime);

        if (result.success) {
          results.successfulRequests++;
          process.stdout.write('✅ ');
        } else {
          results.failedRequests++;
          process.stdout.write('❌ ');

          // Track error types
          const errorType = result.error || 'Unknown';
          results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
        }

        // Update min/max
        results.minResponseTime = Math.min(results.minResponseTime, result.responseTime);
        results.maxResponseTime = Math.max(results.maxResponseTime, result.responseTime);
      })();

      batchPromises.push(requestPromise);
    }

    await Promise.allSettled(batchPromises);

    console.log(`\nBatch ${batch + 1}/${totalBatches} complete (${results.successfulRequests}/${results.totalRequests} success)`);
  }

  results.endTime = Date.now();

  // Calculate statistics
  if (responseTimes.length > 0) {
    results.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Calculate P95
    const sorted = responseTimes.slice().sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    results.p95ResponseTime = sorted[p95Index] || 0;
  }

  return results;
}

/**
 * Display API load test results
 */
function displayAPIResults(results: APILoadTestResult): void {
  console.log('\n\n📊 ====== API LOAD TEST RESULTS ======\n');

  const durationSeconds = (results.endTime - results.startTime) / 1000;
  const successRate = (results.successfulRequests / results.totalRequests) * 100;
  const requestsPerSecond = results.totalRequests / durationSeconds;

  console.log(`Total Requests:      ${results.totalRequests}`);
  console.log(`Successful:          ${results.successfulRequests} (${successRate.toFixed(1)}%)`);
  console.log(`Failed:              ${results.failedRequests}`);

  console.log(`\nResponse Times:`);
  console.log(`Average:             ${results.avgResponseTime.toFixed(0)}ms`);
  console.log(`Min:                 ${results.minResponseTime}ms`);
  console.log(`Max:                 ${results.maxResponseTime}ms`);
  console.log(`P95:                 ${results.p95ResponseTime}ms`);

  console.log(`\nThroughput:`);
  console.log(`Duration:            ${durationSeconds.toFixed(2)}s`);
  console.log(`Requests/sec:        ${requestsPerSecond.toFixed(2)}`);

  if (Object.keys(results.errorTypes).length > 0) {
    console.log(`\nError Breakdown:`);
    Object.entries(results.errorTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
  }

  console.log('\n\n✅ Assessment:');
  if (successRate >= 95 && results.p95ResponseTime < 5000) {
    console.log('🟢 EXCELLENT: API performing well under load');
  } else if (successRate >= 80 && results.p95ResponseTime < 10000) {
    console.log('🟡 GOOD: Minor performance issues, acceptable for launch');
  } else if (successRate >= 50) {
    console.log('🟠 WARNING: Significant issues, optimize before production');
  } else {
    console.log('🔴 CRITICAL: API failing under load, do not deploy');
  }

  if (results.avgResponseTime > 3000) {
    console.log('⚠️  High average response time. Consider:');
    console.log('   - Caching scanner results');
    console.log('   - Adding Redis queue for image generation');
    console.log('   - Optimizing Gemini API calls');
  }

  console.log('\n====================================\n');
}

/**
 * Run the test
 */
if (require.main === module) {
  runAPILoadTest()
    .then(displayAPIResults)
    .catch((error) => {
      console.error('\n❌ API load test failed:', error);
      process.exit(1);
    });
}

export { runAPILoadTest, APILoadTestResult };
