#!/bin/bash
# Bot Swarm Deployment Script
# Deploys bot swarm with all fixes from incident report

echo "========================================"
echo "🤖 THE PONTIFF - BOT SWARM DEPLOYMENT"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to scripts directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Verify environment variables
echo "Step 1: Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS not set${NC}"
    echo "Please ensure .env.local is properly configured"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_GUILT_ADDRESS" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_GUILT_ADDRESS not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables verified${NC}"
echo "   Factory: $NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS"
echo "   GUILT: $NEXT_PUBLIC_GUILT_ADDRESS"
echo ""

# Step 2: Fund bots
echo "Step 2: Funding bots with MON and GUILT..."
echo -e "${YELLOW}   - Each bot gets 0.1 MON (for gas)${NC}"
echo -e "${YELLOW}   - Each bot gets deposit + 5 GUILT buffer (for fees)${NC}"
echo ""

npx ts-node fund-bots.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Bot funding failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bots funded successfully${NC}"
echo ""

# Step 3: Spawn bot sessions
echo "Step 3: Spawning bot sessions on-chain..."
echo -e "${YELLOW}   - Creating session wallets via factory${NC}"
echo -e "${YELLOW}   - Using forced gas limits (5M) to bypass RPC estimation${NC}"
echo -e "${YELLOW}   - Recording sessions in database${NC}"
echo ""

npx ts-node spawn-bot-swarm.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Session spawning failed!${NC}"
    echo -e "${YELLOW}⚠️  Check logs above for details${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bot sessions spawned successfully${NC}"
echo ""

# Step 4: Verify deployment
echo "Step 4: Verifying deployment..."

if [ ! -f "wallets.json" ]; then
    echo -e "${RED}❌ wallets.json not found${NC}"
    exit 1
fi

if [ ! -f "sessions.json" ]; then
    echo -e "${RED}❌ sessions.json not found${NC}"
    exit 1
fi

WALLET_COUNT=$(cat wallets.json | grep "address" | wc -l)
SESSION_COUNT=$(cat sessions.json | grep "sessionWallet" | wc -l)

echo -e "${GREEN}✅ Deployment verified${NC}"
echo "   Wallets created: $WALLET_COUNT"
echo "   Sessions spawned: $SESSION_COUNT"
echo ""

# Step 5: Summary
echo "========================================"
echo "🎉 BOT SWARM DEPLOYMENT COMPLETE"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start the agent manager service to begin gameplay"
echo "2. Monitor bot activity in the database (agent_sessions table)"
echo "3. Check live game feed for bot games"
echo ""
echo "Files created:"
echo "  - wallets.json (bot wallet addresses and private keys)"
echo "  - sessions.json (session wallet addresses and IDs)"
echo ""
echo -e "${GREEN}✅ Ready for demo!${NC}"