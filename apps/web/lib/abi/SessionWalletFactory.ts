// SessionWalletFactory ABI for Pontiff Agent Hire System
// Contract Address: 0xc5bacd1ae1C486c029C51716f00CCDb359B0335A (Monad Testnet)

export const SessionWalletFactoryABI = [
    {
        type: 'function',
        name: 'createSession',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_strategy', type: 'uint8' }],
        outputs: [{ name: 'wallet', type: 'address' }]
    },
    {
        type: 'function',
        name: 'getStrategyFee',
        stateMutability: 'view',
        inputs: [{ name: '_strategy', type: 'uint8' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        type: 'function',
        name: 'getSessions',
        stateMutability: 'view',
        inputs: [{ name: '_owner', type: 'address' }],
        outputs: [{ name: '', type: 'address[]' }]
    },
    {
        type: 'function',
        name: 'owner',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
    },
    {
        type: 'function',
        name: 'guiltToken',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
    },
    {
        type: 'event',
        name: 'SessionCreated',
        inputs: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'wallet', type: 'address', indexed: true },
            { name: 'strategy', type: 'uint8', indexed: false },
            { name: 'fee', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    }
] as const;

// Strategy enum mapping to contract values
export enum Strategy {
    BERZERKER = 0,
    MERCHANT = 1,
    DISCIPLE = 2
}

// Default fees (in GUILT tokens, 18 decimals)
// These can be overridden by reading from contract
export const DEFAULT_STRATEGY_FEES: Record<string, bigint> = {
    BERZERKER: BigInt('10000000000000000000'), // 10 GUILT
    MERCHANT: BigInt('15000000000000000000'),  // 15 GUILT
    DISCIPLE: BigInt('5000000000000000000')    // 5 GUILT
};

// Helper to convert agent ID to strategy enum
export function agentIdToStrategy(agentId: string): Strategy {
    const normalizedId = agentId.toLowerCase();
    switch (normalizedId) {
        case 'berzerker':
        case 'the berzerker':
            return Strategy.BERZERKER;
        case 'merchant':
        case 'the merchant':
            return Strategy.MERCHANT;
        case 'disciple':
        case 'the disciple':
            return Strategy.DISCIPLE;
        default:
            return Strategy.MERCHANT; // Default to Merchant
    }
}

// Get fee for strategy
export function getStrategyFee(strategy: Strategy): bigint {
    switch (strategy) {
        case Strategy.BERZERKER:
            return DEFAULT_STRATEGY_FEES.BERZERKER;
        case Strategy.MERCHANT:
            return DEFAULT_STRATEGY_FEES.MERCHANT;
        case Strategy.DISCIPLE:
            return DEFAULT_STRATEGY_FEES.DISCIPLE;
        default:
            return DEFAULT_STRATEGY_FEES.MERCHANT;
    }
}

// Format fee for display
export function formatFee(fee: bigint): string {
    return (Number(fee) / 1e18).toFixed(2);
}
