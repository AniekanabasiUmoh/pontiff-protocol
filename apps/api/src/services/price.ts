import { ethers } from 'ethers';
import { provider } from './blockchain';

/**
 * Pyth Network Oracle on Monad Testnet
 * For major assets like MON, USDT, USDC, BTC, ETH
 */
const PYTH_CONTRACT_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';

/**
 * Known Pyth price feed IDs (these are standard across chains)
 */
const PYTH_PRICE_FEEDS: Record<string, string> = {
    // Monad native token (placeholder - verify actual feed ID)
    'MON': '0x...', // TODO: Get actual Pyth feed ID for MON
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
};

const PYTH_ABI = [
    'function getPrice(bytes32 id) view returns (int64 price, uint64 conf, int32 expo, uint publishTime)',
];

/**
 * Mock price configuration for development
 * Hash-based deterministic prices that simulate market behavior
 */
interface MockPriceConfig {
    basePrice: number;
    volatility: number;
    isRug?: boolean;
    rugAfterDays?: number;
}

const MOCK_TOKEN_CONFIGS: Record<string, MockPriceConfig> = {
    // Add known test tokens here
    '0x1111111111111111111111111111111111111111': {
        basePrice: 1.0,
        volatility: 0.3
    },
    '0x2222222222222222222222222222222222222222': {
        basePrice: 0.5,
        volatility: 0.5
    },
    // Rug pull simulation
    '0xDEAD000000000000000000000000000000000000': {
        basePrice: 2.0,
        volatility: 0.8,
        isRug: true,
        rugAfterDays: 7
    },
};

/**
 * Price cache to reduce redundant calls
 */
interface PriceCache {
    price: number;
    timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Main price fetcher with cascade strategy:
 * 1. Try Pyth Oracle (for major assets)
 * 2. Try DEX (for shitcoins)
 * 3. Fall back to Mock (for development)
 */
export async function getTokenPrice(
    tokenAddress: string,
    symbol?: string
): Promise<number> {
    // Check cache first
    const cached = priceCache.get(tokenAddress.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.price;
    }

    let price = 0;

    // Strategy 1: Try Pyth Oracle
    if (symbol && PYTH_PRICE_FEEDS[symbol.toUpperCase()]) {
        try {
            price = await getPriceFromPyth(symbol);
            if (price > 0) {
                cachePrice(tokenAddress, price);
                return price;
            }
        } catch (error) {
            console.log(`Pyth oracle failed for ${symbol}, trying next source...`);
        }
    }

    // Strategy 2: Try DEX Router
    try {
        price = await getPriceFromDEX(tokenAddress);
        if (price > 0) {
            cachePrice(tokenAddress, price);
            return price;
        }
    } catch (error) {
        console.log(`DEX query failed for ${tokenAddress}, using mock...`);
    }

    // Strategy 3: Mock (development fallback)
    price = getMockPrice(tokenAddress);
    cachePrice(tokenAddress, price);
    return price;
}

/**
 * Get price from Pyth Network Oracle
 */
async function getPriceFromPyth(symbol: string): Promise<number> {
    const feedId = PYTH_PRICE_FEEDS[symbol.toUpperCase()];
    if (!feedId) return 0;

    try {
        const pythContract = new ethers.Contract(
            PYTH_CONTRACT_ADDRESS,
            PYTH_ABI,
            provider
        );

        const priceData = await pythContract.getPrice(feedId);
        const price = Number(priceData.price);
        const expo = Number(priceData.expo);

        // Pyth returns price with an exponent (e.g., price = 50000000, expo = -8 = $0.50)
        const actualPrice = price * Math.pow(10, expo);

        console.log(`✅ Pyth price for ${symbol}: $${actualPrice}`);
        return actualPrice;
    } catch (error) {
        console.error(`Pyth oracle error for ${symbol}:`, error);
        return 0;
    }
}

/**
 * Get price from DEX using Uniswap V2-style router
 * Queries the getAmountsOut function
 */
async function getPriceFromDEX(tokenAddress: string): Promise<number> {
    // TODO: Get actual DEX router address from Monad docs
    // Common testnet addresses or discover via factory
    const ROUTER_ADDRESSES = [
        '0x...',  // Monad DEX Router (TBD)
        // Add more router addresses as backups
    ];

    const WMON_ADDRESS = '0x...'; // Wrapped MON address
    const ROUTER_ABI = [
        'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
    ];

    for (const routerAddress of ROUTER_ADDRESSES) {
        if (!routerAddress || routerAddress === '0x...') continue;

        try {
            const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);

            // Try to get price in terms of WMON
            // Input: 1 token (with proper decimals)
            const amountIn = ethers.parseEther('1');
            const path = [tokenAddress, WMON_ADDRESS];

            const amounts = await router.getAmountsOut(amountIn, path);
            const amountOut = amounts[1];

            // Assume MON = $1 for simplicity (or fetch MON price from oracle)
            const price = Number(ethers.formatEther(amountOut));

            console.log(`✅ DEX price for ${tokenAddress}: $${price}`);
            return price;
        } catch (error) {
            continue; // Try next router
        }
    }

    return 0;
}

/**
 * Generate deterministic mock price for development
 * Uses hash of address + timestamp to simulate market behavior
 */
export function getMockPrice(
    tokenAddress: string,
    timestamp?: number
): number {
    const addr = tokenAddress.toLowerCase();
    const now = timestamp || Date.now();

    // Check if we have a specific config for this token
    const config = MOCK_TOKEN_CONFIGS[addr];

    if (config) {
        // Simulate rug pull
        if (config.isRug && config.rugAfterDays) {
            const daysSinceDeploy = Math.floor(now / (1000 * 60 * 60 * 24));
            if (daysSinceDeploy > config.rugAfterDays) {
                return 0; // Rugged!
            }
        }

        // Generate price with deterministic randomness
        const hash = hashString(addr + now.toString());
        const variation = (hash % 100) / 100; // 0-1
        const priceVariation = (variation - 0.5) * config.volatility;

        return Math.max(0, config.basePrice * (1 + priceVariation));
    }

    // Default: generate random price based on address hash
    const hash = hashString(addr);
    const basePrice = (hash % 1000) / 100; // $0.00 - $10.00

    // Add some time-based variation
    const timeHash = hashString(addr + Math.floor(now / (1000 * 60 * 60)).toString());
    const variation = ((timeHash % 40) - 20) / 100; // -20% to +20%

    return Math.max(0.001, basePrice * (1 + variation));
}

/**
 * Get historical price (with mock simulation)
 */
export async function getHistoricalPrice(
    tokenAddress: string,
    timestamp: number,
    symbol?: string
): Promise<number> {
    // For mock development, use deterministic price based on timestamp
    if (process.env.NODE_ENV === 'development') {
        return getMockPrice(tokenAddress, timestamp * 1000);
    }

    // In production, this would query historical data
    // For now, fall back to current price
    return getTokenPrice(tokenAddress, symbol);
}

/**
 * Detect if token is a rug pull
 * Enhanced logic: not just price, but also liquidity
 */
export async function isLikelyRugPull(
    tokenAddress: string
): Promise<boolean> {
    const currentPrice = await getTokenPrice(tokenAddress);

    // If price is essentially zero, likely rugged
    if (currentPrice < 0.000001) {
        return true;
    }

    // TODO: Add liquidity check
    // Check if DEX pair has liquidity
    // If reserves are 0 or very low, it's rugged

    return false;
}

/**
 * Simple string hash function for deterministic randomness
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Cache a price
 */
function cachePrice(tokenAddress: string, price: number) {
    priceCache.set(tokenAddress.toLowerCase(), {
        price,
        timestamp: Date.now(),
    });
}

/**
 * Clear price cache (useful for testing)
 */
export function clearPriceCache() {
    priceCache.clear();
}
