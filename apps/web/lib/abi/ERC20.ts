// Standard ERC20 ABI for token interactions
// Used for GUILT token approval and balance checks

export const ERC20_ABI = [
    {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        type: 'function',
        name: 'allowance',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        type: 'function',
        name: 'transfer',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        type: 'function',
        name: 'transferFrom',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        type: 'function',
        name: 'decimals',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
    },
    {
        type: 'function',
        name: 'symbol',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
    },
    {
        type: 'function',
        name: 'name',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
    },
    {
        type: 'function',
        name: 'totalSupply',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        type: 'event',
        name: 'Transfer',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false }
        ]
    },
    {
        type: 'event',
        name: 'Approval',
        inputs: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'spender', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false }
        ]
    }
] as const;

// Helper to format token amounts for display
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;

    if (fraction === BigInt(0)) {
        return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(decimals, '0');
    const trimmedFraction = fractionStr.replace(/0+$/, '').slice(0, 4);

    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

// Helper to parse token amounts from user input
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
}
