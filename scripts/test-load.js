// k6 Load Testing Script for Pontiff
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 50 },   // Scale down to 50
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.1'],    // Less than 10% of requests should fail
    'errors': ['rate<0.1'],
  },
};

const testWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

export default function () {
  // Test 1: Homepage load
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Leaderboard - Shame
  res = http.get(`${BASE_URL}/api/leaderboard/shame`);
  check(res, {
    'leaderboard shame status 200': (r) => r.status === 200,
    'leaderboard shame has data': (r) => r.json('leaderboard') !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Leaderboard - Saints
  res = http.get(`${BASE_URL}/api/leaderboard/saints`);
  check(res, {
    'leaderboard saints status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Vatican State
  res = http.get(`${BASE_URL}/api/vatican/state`);
  check(res, {
    'vatican state status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Game History
  res = http.get(`${BASE_URL}/api/analytics/game-history`);
  check(res, {
    'game history status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: Revenue Analytics
  res = http.get(`${BASE_URL}/api/analytics/revenue`);
  check(res, {
    'revenue analytics status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 7: Confess (POST)
  res = http.post(`${BASE_URL}/api/vatican/confess`, JSON.stringify({
    wallet: testWallet,
    sin: 'Automated load test confession',
    stake: '0.001'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'confess request handled': (r) => r.status === 200 || r.status === 400,
  }) || errorRate.add(1);

  sleep(2);

  // Test 8: Scan Wallet
  res = http.get(`${BASE_URL}/api/scan/${testWallet}`);
  check(res, {
    'scan wallet handled': (r) => r.status === 200 || r.status === 400,
  }) || errorRate.add(1);

  sleep(1);

  // Test 9: Tournaments List
  res = http.get(`${BASE_URL}/api/tournaments`);
  check(res, {
    'tournaments status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'test-results-load.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const metrics = data.metrics;

  return `
=== K6 LOAD TEST SUMMARY ===

HTTP Requests:
  Total: ${metrics.http_reqs.values.count}
  Failed: ${metrics.http_req_failed.values.passes} (${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%)

Response Times:
  Min: ${metrics.http_req_duration.values.min.toFixed(2)}ms
  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms
  Avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms
  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

Data Transfer:
  Received: ${(metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB
  Sent: ${(metrics.data_sent.values.count / 1024).toFixed(2)} KB

Virtual Users:
  Max: ${metrics.vus_max.values.max}

Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%

Status: ${metrics.http_req_failed.values.rate < 0.1 && metrics.http_req_duration.values['p(95)'] < 500 ? 'PASS' : 'FAIL'}
`;
}
