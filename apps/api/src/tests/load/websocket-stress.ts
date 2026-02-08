/**
 * WebSocket Load Testing: Real-time Update Stress Test
 *
 * Tests WebSocket infrastructure under load:
 * - 200 concurrent connections
 * - Simulates live dashboard updates during betrayal surge
 * - Measures message delivery latency
 *
 * USAGE:
 *   npx ts-node src/tests/load/websocket-stress.ts
 */

import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const CONFIG = {
  WS_URL: process.env.WS_URL || 'ws://localhost:3001',
  CONCURRENT_CONNECTIONS: 200,
  TEST_DURATION_MS: 60000, // 1 minute
  MESSAGE_INTERVAL_MS: 1000, // Send message every 1 second
};

interface WebSocketLoadTestResult {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  messagesSent: number;
  messagesReceived: number;
  avgLatency: number;
  maxLatency: number;
  disconnects: number;
  errors: number;
  startTime: number;
  endTime: number;
}

/**
 * Create a WebSocket client and track metrics
 */
function createTestClient(
  clientId: number,
  results: WebSocketLoadTestResult,
  latencies: number[]
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(CONFIG.WS_URL);
      let isConnected = false;
      let messageInterval: NodeJS.Timeout;

      ws.on('open', () => {
        isConnected = true;
        results.successfulConnections++;
        process.stdout.write('🟢 ');

        // Subscribe to epoch updates (typical dashboard behavior)
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            channel: 'epoch',
          })
        );

        // Periodically send ping to simulate active user
        messageInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const sendTime = Date.now();
            ws.send(
              JSON.stringify({
                type: 'ping',
                timestamp: sendTime,
              })
            );
            results.messagesSent++;
          }
        }, CONFIG.MESSAGE_INTERVAL_MS);
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          results.messagesReceived++;

          // Calculate latency for ping/pong
          if (message.type === 'pong' && message.timestamp) {
            const latency = Date.now() - message.timestamp;
            latencies.push(latency);
            results.maxLatency = Math.max(results.maxLatency, latency);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      ws.on('error', (error) => {
        results.errors++;
        if (!isConnected) {
          results.failedConnections++;
          process.stdout.write('🔴 ');
        }
      });

      ws.on('close', () => {
        if (isConnected) {
          results.disconnects++;
        }
        clearInterval(messageInterval);
        resolve();
      });

      // Auto-close after test duration
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else {
          resolve();
        }
      }, CONFIG.TEST_DURATION_MS);
    } catch (error) {
      results.failedConnections++;
      process.stdout.write('🔴 ');
      resolve();
    }
  });
}

/**
 * Run WebSocket load test
 */
async function runWebSocketLoadTest(): Promise<WebSocketLoadTestResult> {
  console.log('🌐 STARTING WEBSOCKET LOAD TEST 🌐\n');
  console.log(`Concurrent Connections: ${CONFIG.CONCURRENT_CONNECTIONS}`);
  console.log(`Test Duration: ${CONFIG.TEST_DURATION_MS / 1000}s`);
  console.log(`WebSocket URL: ${CONFIG.WS_URL}\n`);

  const results: WebSocketLoadTestResult = {
    totalConnections: CONFIG.CONCURRENT_CONNECTIONS,
    successfulConnections: 0,
    failedConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    avgLatency: 0,
    maxLatency: 0,
    disconnects: 0,
    errors: 0,
    startTime: Date.now(),
    endTime: 0,
  };

  const latencies: number[] = [];

  console.log('Opening connections...\n');

  // Create all clients concurrently
  const clientPromises = Array.from({ length: CONFIG.CONCURRENT_CONNECTIONS }, (_, i) =>
    createTestClient(i, results, latencies)
  );

  // Wait for all clients to complete
  await Promise.allSettled(clientPromises);

  results.endTime = Date.now();

  // Calculate average latency
  if (latencies.length > 0) {
    results.avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  return results;
}

/**
 * Display WebSocket load test results
 */
function displayWebSocketResults(results: WebSocketLoadTestResult): void {
  console.log('\n\n📊 ====== WEBSOCKET LOAD TEST RESULTS ======\n');

  const connectionRate = (results.successfulConnections / results.totalConnections) * 100;
  const messageDeliveryRate =
    results.messagesSent > 0 ? (results.messagesReceived / results.messagesSent) * 100 : 0;

  console.log(`Connections:`);
  console.log(`  Total:             ${results.totalConnections}`);
  console.log(`  Successful:        ${results.successfulConnections} (${connectionRate.toFixed(1)}%)`);
  console.log(`  Failed:            ${results.failedConnections}`);
  console.log(`  Disconnects:       ${results.disconnects}`);

  console.log(`\nMessaging:`);
  console.log(`  Sent:              ${results.messagesSent}`);
  console.log(`  Received:          ${results.messagesReceived}`);
  console.log(`  Delivery Rate:     ${messageDeliveryRate.toFixed(1)}%`);

  console.log(`\nLatency:`);
  console.log(`  Average:           ${results.avgLatency.toFixed(0)}ms`);
  console.log(`  Max:               ${results.maxLatency}ms`);

  console.log(`\nErrors:`);
  console.log(`  Total Errors:      ${results.errors}`);

  console.log('\n\n✅ Assessment:');
  if (connectionRate >= 95 && messageDeliveryRate >= 95 && results.avgLatency < 100) {
    console.log('🟢 EXCELLENT: WebSocket infrastructure solid');
  } else if (connectionRate >= 80 && messageDeliveryRate >= 80 && results.avgLatency < 500) {
    console.log('🟡 GOOD: Minor issues, acceptable for launch');
  } else if (connectionRate >= 50) {
    console.log('🟠 WARNING: Connection issues, investigate server capacity');
  } else {
    console.log('🔴 CRITICAL: WebSocket infrastructure failing');
  }

  if (results.avgLatency > 200) {
    console.log('⚠️  High latency detected. Real-time updates may feel sluggish.');
  }

  console.log('\n============================================\n');
}

/**
 * Run the test
 */
if (require.main === module) {
  runWebSocketLoadTest()
    .then(displayWebSocketResults)
    .catch((error) => {
      console.error('\n❌ WebSocket load test failed:', error);
      process.exit(1);
    });
}

export { runWebSocketLoadTest, WebSocketLoadTestResult };
