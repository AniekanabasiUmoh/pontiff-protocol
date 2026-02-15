export const StakingCathedralABI = [
    {
        "type": "constructor",
        "inputs": [
            { "name": "_asset", "type": "address", "internalType": "contract IERC20" },
            { "name": "_initialOwner", "type": "address", "internalType": "address" }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "allowance",
        "inputs": [
            { "name": "owner", "type": "address", "internalType": "address" },
            { "name": "spender", "type": "address", "internalType": "address" }
        ],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "approve",
        "inputs": [
            { "name": "spender", "type": "address", "internalType": "address" },
            { "name": "value", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "asset",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address", "internalType": "contract IERC20" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "convertToAssets",
        "inputs": [{ "name": "shares", "type": "uint256", "internalType": "uint256" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "convertToShares",
        "inputs": [{ "name": "assets", "type": "uint256", "internalType": "uint256" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "stake",
        "inputs": [{ "name": "assets", "type": "uint256", "internalType": "uint256" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "withdraw",
        "inputs": [{ "name": "shares", "type": "uint256", "internalType": "uint256" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },

    {
        "type": "function",
        "name": "totalAssets",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "totalSupply",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    }
] as const;

export const GuiltTokenABI = [
    {
        "type": "function",
        "name": "approve",
        "inputs": [
            { "name": "spender", "type": "address", "internalType": "address" },
            { "name": "value", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "allowance",
        "inputs": [
            { "name": "owner", "type": "address", "internalType": "address" },
            { "name": "spender", "type": "address", "internalType": "address" }
        ],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isTaxExempt",
        "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
        "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "stakingWallet",
        "inputs": [],
        "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
        "stateMutability": "view"
    }
] as const;

export const JudasProtocolABI = [
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'signalBetrayal',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'resolveEpoch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'upToEpoch', type: 'uint256' }],
        name: 'claimRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getGameState',
        outputs: [
            { name: 'epochId', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'totalLoyal', type: 'uint256' },
            { name: 'totalBetrayed', type: 'uint256' },
            { name: 'resolved', type: 'bool' },
            { name: 'betrayalPct', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getUserPosition',
        outputs: [
            { name: 'staked', type: 'uint256' },
            { name: 'isBetrayer', type: 'bool' },
            { name: 'lastEpochInteracted', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTournamentState',
        outputs: [
            { name: 'tournamentId', type: 'uint256' },
            { name: 'currentRound', type: 'uint256' },
            { name: 'maxRounds', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReputation',
        outputs: [
            { name: 'loyal', type: 'uint32' },
            { name: 'betrayed', type: 'uint32' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'userInfo', // Keeping for legacy/compatibility if needed, but primarily using getUserPosition
        outputs: [
            { name: 'staked', type: 'uint256' },
            { name: 'lastEpochInteracted', type: 'uint256' },
            { name: 'isBetrayer', type: 'bool' }
        ],
        stateMutability: 'view',
        type: 'function',
    }
] as const;

export const IndulgenceABI = [
    {
        "inputs": [],
        "name": "checkPrice",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint8", "name": "tier", "type": "uint8" }],
        "name": "absolve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const RPSGameABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "commitment", "type": "bytes32" },
            { "internalType": "uint256", "name": "wagerAmount", "type": "uint256" },
            { "internalType": "address", "name": "token", "type": "address" }
        ],
        "name": "createGame",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "internalType": "uint8", "name": "move", "type": "uint8" },
            { "internalType": "uint256", "name": "wagerAmount", "type": "uint256" }
        ],
        "name": "joinGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "internalType": "uint8", "name": "move", "type": "uint8" },
            { "internalType": "bytes32", "name": "salt", "type": "bytes32" }
        ],
        "name": "revealMove",
        "outputs": [{ "internalType": "address", "name": "winner", "type": "address" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "gameId", "type": "uint256" }],
        "name": "timeout",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "games",
        "outputs": [
            { "internalType": "address", "name": "player1", "type": "address" },
            { "internalType": "address", "name": "player2", "type": "address" },
            { "internalType": "uint256", "name": "wagerAmount", "type": "uint256" },
            { "internalType": "bytes32", "name": "commitment1", "type": "bytes32" },
            { "internalType": "uint8", "name": "move2", "type": "uint8" },
            { "internalType": "bool", "name": "isRevealed", "type": "bool" },
            { "internalType": "address", "name": "token", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "player1", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "wager", "type": "uint256" }
        ],
        "name": "GameCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "player2", "type": "address" }
        ],
        "name": "GameJoined",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "indexed": false, "internalType": "address", "name": "winner", "type": "address" }
        ],
        "name": "GameResolved",
        "type": "event"
    }
] as const;
