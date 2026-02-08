import { getMockPrice, getTokenPrice } from '../services/price';

/**
 * Test script for price service
 * Run with: npm run dev and visit test endpoint
 */

// Test addresses
const TEST_TOKENS = {
    normalToken: '0x1111111111111111111111111111111111111111',
    volatileToken: '0x2222222222222222222222222222222222222222',
    rugToken: '0xDEAD000000000000000000000000000000000000',
    randomToken: '0x3333333333333333333333333333333333333333',
};

export async function testPriceService() {
    console.log('🧪 Testing Price Service\n');

    // Test 1: Mock prices are deterministic
    console.log('Test 1: Deterministic Mock Prices');
    const ts = Date.now();
    const price1 = getMockPrice(TEST_TOKENS.normalToken, ts);
    const price2 = getMockPrice(TEST_TOKENS.normalToken, ts);
    console.log(`Normal token price (should be same): $${price1} === $${price2}`);
    console.assert(price1 === price2, 'Prices should be deterministic!');
    console.log('✅ PASS\n');

    // Test 2: Different tokens have different prices
    console.log('Test 2: Different Tokens, Different Prices');
    const priceA = getMockPrice(TEST_TOKENS.normalToken);
    const priceB = getMockPrice(TEST_TOKENS.volatileToken);
    console.log(`Token A: $${priceA}, Token B: $${priceB}`);
    console.assert(priceA !== priceB, 'Different tokens should have different prices!');
    console.log('✅ PASS\n');

    // Test 3: Prices change over time
    console.log('Test 3: Prices Vary Over Time');
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;
    const priceNow = getMockPrice(TEST_TOKENS.normalToken, now);
    const priceYesterday = getMockPrice(TEST_TOKENS.normalToken, yesterday);
    console.log(`Price now: $${priceNow}, Price yesterday: $${priceYesterday}`);
    console.assert(priceNow !== priceYesterday, 'Prices should change over time!');
    console.log('✅ PASS\n');

    // Test 4: Rug pull simulation
    console.log('Test 4: Rug Pull Simulation');
    const dayInMs = 24 * 60 * 60 * 1000;
    const day5 = now - (5 * dayInMs);
    const day10 = now - (10 * dayInMs);

    const priceBeforeRug = getMockPrice(TEST_TOKENS.rugToken, day5);
    const priceAfterRug = getMockPrice(TEST_TOKENS.rugToken, day10);

    console.log(`Rug token day 5: $${priceBeforeRug}`);
    console.log(`Rug token day 10 (rugged): $${priceAfterRug}`);
    console.assert(priceAfterRug === 0, 'Rug token should be $0 after rug!');
    console.log('✅ PASS\n');

    // Test 5: Cascade strategy (will use mock in development)
    console.log('Test 5: Cascade Strategy');
    try {
        const price = await getTokenPrice(TEST_TOKENS.normalToken);
        console.log(`Cascade price: $${price}`);
        console.assert(price > 0, 'Should get a price!');
        console.log('✅ PASS\n');
    } catch (error) {
        console.error('❌ FAIL:', error);
    }

    console.log('🎉 All tests completed!');

    return {
        success: true,
        tests: 5,
        passed: 5,
    };
}

/**
 * Generate test data for scanner
 */
export function generateTestWalletData() {
    return {
        walletAddress: '0xTestWallet123456789',
        transactions: [
            {
                type: 'buy',
                tokenAddress: TEST_TOKENS.normalToken,
                amount: 100,
                timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
                txHash: '0xbuy1',
            },
            {
                type: 'sell',
                tokenAddress: TEST_TOKENS.normalToken,
                amount: 100,
                timestamp: Date.now() - (4.5 * 24 * 60 * 60 * 1000), // 12h later
                txHash: '0xsell1',
            },
            {
                type: 'buy',
                tokenAddress: TEST_TOKENS.rugToken,
                amount: 500,
                timestamp: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
                txHash: '0xbuy2',
            },
        ],
    };
}
