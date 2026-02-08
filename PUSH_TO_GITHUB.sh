#!/bin/bash
# Script to push Pontiff Protocol to GitHub
# Run after setting up SSH key

set -e  # Exit on error

echo "🚀 Pushing Pontiff Protocol to GitHub..."
echo ""

# Check if in correct directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the Pontiff root directory"
    exit 1
fi

# Step 1: Initialize git (if not already done)
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Step 2: Add remote (if not already added)
if git remote | grep -q "origin"; then
    echo "✅ Remote 'origin' already exists"
    git remote -v
else
    echo "📡 Adding remote repository..."
    git remote add origin git@github.com:AniekanabasiUmoh/pontiff-protocol.git
    echo "✅ Remote added"
    git remote -v
fi

# Step 3: Check git status
echo ""
echo "📊 Git status:"
git status --short | head -20
echo "..."
echo ""

# Step 4: Stage all files
echo "➕ Staging all files..."
git add .
echo "✅ Files staged"

# Step 5: Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short | head -20
echo "..."
echo ""

# Step 6: Create commit
echo "💾 Creating commit..."
git commit -m "Initial commit: Pontiff Protocol - Session Wallet System

Module 5: Session Wallet System (Complete)
- Smart contracts: SessionWallet, SessionWalletFactory
- Backend: AgentManagerService with 3 strategies (Berzerker/Merchant/Disciple)
- Frontend: CreateSessionWidget UI component
- Database: agent_sessions table migration
- Documentation: Complete implementation guide

Core Features:
- Autonomous AI agents playing games on behalf of users
- Three risk strategies with configurable parameters
- Stop-loss and take-profit safety mechanisms
- Session expiry and auto-withdrawal
- Gas-efficient minimal proxy pattern for session wallets

Technical Stack:
- Solidity 0.8.20 with OpenZeppelin
- Next.js 14 with TypeScript
- Supabase PostgreSQL
- Hardhat development framework
- Monad blockchain (EVM-compatible)

Games Implemented:
- Rock-Paper-Scissors (Module 2)
- Judas Protocol / Prisoner's Dilemma (Module 3)
- Session-based autonomous gameplay (Module 5)

Documentation:
- DEPLOYMENT_GUIDE.md - Smart contract deployment
- GITHUB_SETUP.md - Repository setup guide
- Module 5 Implementation Guide - Deep dive
- Complete Build Reference - System overview
- Identified Errors log - Bug fixes and lessons

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo "✅ Commit created"
echo ""

# Step 7: Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "⚠️  If this is your first push, you may be asked to verify GitHub's fingerprint."
echo "   Type 'yes' to continue."
echo ""

git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🎉 Repository URL: https://github.com/AniekanabasiUmoh/pontiff-protocol"
echo ""
echo "Next steps:"
echo "1. Visit the repository URL above"
echo "2. Verify all files are present"
echo "3. Add repository description and topics"
echo "4. Consider setting up branch protection rules"
