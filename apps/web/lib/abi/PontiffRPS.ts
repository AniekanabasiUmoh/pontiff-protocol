export const PONTIFF_RPS_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_guiltToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_treasury",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_pontiff",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "gameId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "wager",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum PontiffRPS.Move",
                "name": "playerMove",
                "type": "uint8"
            }
        ],
        "name": "GameCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "gameId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum PontiffRPS.GameResult",
                "name": "result",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "payout",
                "type": "uint256"
            }
        ],
        "name": "GameSettled",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "HOUSE_FEE_PERCENT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "gameCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "games",
        "outputs": [
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "wager",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "playerMove",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "pontiffMove",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "result",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "payout",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "settled",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_gameId",
                "type": "uint256"
            }
        ],
        "name": "getGame",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "player",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "wager",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "playerMove",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "pontiffMove",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "result",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "payout",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "settled",
                        "type": "bool"
                    }
                ],
                "internalType": "struct PontiffRPS.Game",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "guiltToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "_playerMove",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "_wager",
                "type": "uint256"
            }
        ],
        "name": "playRPS",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "gameId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pontiff",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_gameId",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_pontiffMove",
                "type": "uint8"
            }
        ],
        "name": "settleGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "treasury",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;
