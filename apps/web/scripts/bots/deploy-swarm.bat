@echo off
REM Bot Swarm Deployment Script for Windows
REM Deploys bot swarm with all fixes from incident report

echo ========================================
echo 🤖 THE PONTIFF - BOT SWARM DEPLOYMENT
echo ========================================
echo.

cd /d "%~dp0"

echo 📍 Current directory: %CD%
echo.

REM Step 1: Verify environment variables
echo Step 1: Verifying environment configuration...
if not exist "..\..\..\.env.local" (
    echo ❌ .env.local not found
    echo Please ensure .env.local exists in apps/web directory
    pause
    exit /b 1
)

echo ✅ Environment file found
echo.

REM Step 2: Fund bots
echo Step 2: Funding bots with MON and GUILT...
echo    - Each bot gets 0.1 MON for gas
echo    - Each bot gets deposit + 5 GUILT buffer for fees
echo.

call npx ts-node fund-bots.ts

if errorlevel 1 (
    echo ❌ Bot funding failed!
    pause
    exit /b 1
)

echo ✅ Bots funded successfully
echo.

REM Step 3: Spawn bot sessions
echo Step 3: Spawning bot sessions on-chain...
echo    - Creating session wallets via factory
echo    - Using forced gas limits 5M to bypass RPC estimation
echo    - Recording sessions in database
echo.

call npx ts-node spawn-bot-swarm.ts

if errorlevel 1 (
    echo ❌ Session spawning failed!
    echo ⚠️  Check logs above for details
    pause
    exit /b 1
)

echo ✅ Bot sessions spawned successfully
echo.

REM Step 4: Verify deployment
echo Step 4: Verifying deployment...

if not exist "wallets.json" (
    echo ❌ wallets.json not found
    pause
    exit /b 1
)

if not exist "sessions.json" (
    echo ❌ sessions.json not found
    pause
    exit /b 1
)

echo ✅ Deployment verified
echo    Check wallets.json and sessions.json for details
echo.

REM Step 5: Summary
echo ========================================
echo 🎉 BOT SWARM DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. Start the agent manager service to begin gameplay
echo 2. Monitor bot activity in database agent_sessions table
echo 3. Check live game feed for bot games
echo.
echo Files created:
echo   - wallets.json bot wallet addresses and private keys
echo   - sessions.json session wallet addresses and IDs
echo.
echo ✅ Ready for demo!
echo.
pause