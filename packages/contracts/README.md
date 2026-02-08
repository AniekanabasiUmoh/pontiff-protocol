# Smart Contracts Setup

## Foundry Installation Required

To work with the smart contracts, you need to install Foundry first.

### Windows Installation

```powershell
# Install Foundry using foundryup (recommended)
# Visit: https://book.getfoundry.sh/getting-started/installation

# Or install via Scoop
scoop install foundry
```

### After Installing Foundry

```bash
cd packages/contracts

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Build contracts
forge build

# Run tests
forge test
```

### Deploy to Monad Testnet

```bash
# Make sure you have MONAD_RPC_URL and PRIVATE_KEY in .env
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```

## Current Status

- ✅ GuiltToken.sol implemented
- ✅ Foundry config setup
- ✅ Remappings configured
- ⚠️ OpenZeppelin dependencies pending (need Foundry installation)

## Note

The contracts are ready to build/deploy once Foundry is installed. This is not blocking for Phase 2 (Data Layer).
