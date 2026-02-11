# GitHub Repository Setup Guide

This guide shows how to push the Pontiff Protocol project to GitHub.

## Repository Information

- **GitHub URL**: https://github.com/AniekanabasiUmoh/pontiff-protocol
- **Owner**: AniekanabasiUmoh
- **Repo Name**: pontiff-protocol

## Prerequisites

1. **GitHub Account**: Ensure you're logged into AniekanabasiUmoh account
2. **Git Installed**: Run `git --version` to verify
3. **SSH or Personal Access Token**: For authentication

## Step 1: Initialize Git (If Not Already Done)

```bash
cd c:/Dev/Pontiff

# Check if git is already initialized
git status

# If not initialized, run:
git init
```

## Step 2: Create .gitignore

Before committing, ensure sensitive files are excluded:

```bash
# Check if .gitignore exists
ls -la | grep gitignore

# If it doesn't exist, I'll create one for you
```

## Step 3: Add Remote Repository

```bash
# Add GitHub remote
git remote add origin https://github.com/AniekanabasiUmoh/pontiff-protocol.git

# Verify remote was added
git remote -v
```

**Expected Output:**
```
origin  https://github.com/AniekanabasiUmoh/pontiff-protocol.git (fetch)
origin  https://github.com/AniekanabasiUmoh/pontiff-protocol.git (push)
```

## Step 4: Stage Files for Commit

```bash
# Check current status
git status

# Add all files (excluding .gitignore patterns)
git add .

# Review what will be committed
git status
```

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: Pontiff Protocol - Session Wallet System

- Module 5: Session Wallet System (Complete)
- Smart contracts: SessionWallet, SessionWalletFactory
- Backend: AgentManagerService with 3 strategies
- Frontend: CreateSessionWidget UI
- Database: agent_sessions table migration
- Documentation: Full implementation guide

Features:
- Autonomous AI agents playing games on behalf of users
- Three strategies: Berzerker (high risk), Merchant (medium), Disciple (low)
- Stop-loss and take-profit mechanisms
- Session expiry and auto-withdrawal
- Gas-efficient minimal proxy pattern

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Step 6: Push to GitHub

### Option A: Using HTTPS (Requires Personal Access Token)

```bash
# Push to main branch
git push -u origin main

# You'll be prompted for credentials
# Username: AniekanabasiUmoh
# Password: your_personal_access_token
```

**Get Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Generate and save token securely

### Option B: Using SSH (Requires SSH Key)

```bash
# Change remote to SSH
git remote set-url origin git@github.com:AniekanabasiUmoh/pontiff-protocol.git

# Push to main branch
git push -u origin main
```

**Set up SSH Key (if needed):**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

## Step 7: Verify on GitHub

1. Visit: https://github.com/AniekanabasiUmoh/pontiff-protocol
2. Verify files are uploaded
3. Check README displays correctly
4. Confirm commit history shows

## What Will Be Pushed

### Smart Contracts
- `packages/contracts/src/session/SessionWallet.sol`
- `packages/contracts/src/session/SessionWalletFactory.sol`
- All other existing contracts

### Backend Services
- `apps/web/lib/services/agent-manager-service.ts`
- `apps/api/src/` (all backend code)

### Frontend
- `apps/web/app/components/sessions/CreateSessionWidget.tsx`
- `apps/web/app/api/sessions/create/route.ts`
- All other Next.js app code

### Database
- `supabase/migrations/20260208000001_add_agent_sessions.sql`
- All other migrations

### Documentation
- `A Pontiff Roadmap/Module 5 - Session Wallet System - Implementation Guide.md`
- `DEPLOYMENT_GUIDE.md`
- `README.md` (if exists)

### Configuration
- `package.json` files
- `hardhat.config.ts`
- `tsconfig.json` files

### What Will NOT Be Pushed (via .gitignore)
- `.env` files (sensitive keys)
- `node_modules/` (dependencies)
- `dist/` or `build/` (compiled output)
- `.cache/` (temporary files)
- Private keys and secrets

## Branch Strategy

### Main Branch
```bash
# Push to main
git push -u origin main
```

### Development Branch (Recommended)
```bash
# Create and switch to dev branch
git checkout -b development

# Push dev branch
git push -u origin development

# Set dev as default branch on GitHub (optional)
```

### Feature Branches
```bash
# For new features
git checkout -b feature/module-6
git push -u origin feature/module-6

# For bug fixes
git checkout -b fix/session-wallet-bug
git push -u origin fix/session-wallet-bug
```

## Repository Settings (On GitHub)

### 1. Add Repository Description
- **Description**: "The Pontiff Protocol - Autonomous AI agents playing blockchain games. Session wallet system with risk strategies."
- **Website**: Your deployed app URL
- **Topics**: `blockchain`, `solidity`, `defi`, `gaming`, `ai-agents`, `monad`, `nextjs`

### 2. Add README.md
Create a comprehensive README (I can help with this!)

### 3. Set Up Branch Protection
- Settings → Branches → Add rule
- Branch name pattern: `main`
- Enable: Require pull request reviews
- Enable: Require status checks to pass

### 4. Enable GitHub Actions (CI/CD)
Create `.github/workflows/test.yml` for automated testing

## Recommended .gitignore Additions

Make sure your `.gitignore` includes:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production builds
dist/
build/
out/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local
*.env

# Secrets
*.key
*.pem
secrets/
.secrets/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Hardhat
cache/
artifacts/
typechain-types/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/

# Temporary files
*.tmp
.tmp/
temp/

# Deployment info (if contains sensitive data)
deployments/*.json
# Or keep deployments but ensure no private keys inside

# Database
*.db
*.sqlite
```

## Post-Push Checklist

After successful push:

- [ ] Repository visible at https://github.com/AniekanabasiUmoh/pontiff-protocol
- [ ] All source files present
- [ ] No `.env` files or secrets committed
- [ ] README.md displays correctly
- [ ] Commit history accurate
- [ ] Remote branches set up
- [ ] Repository description added
- [ ] Topics/tags added for discoverability

## Next Steps

1. **Create README.md**: Comprehensive project overview
2. **Add LICENSE**: Choose appropriate license (MIT, Apache 2.0, etc.)
3. **Set Up CI/CD**: GitHub Actions for testing/deployment
4. **Add CONTRIBUTING.md**: Guidelines for contributors
5. **Create Issues**: Track bugs and feature requests
6. **Add GitHub Pages**: Host documentation
7. **Set Up Dependabot**: Automated dependency updates

## Troubleshooting

### Error: "remote origin already exists"

```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/AniekanabasiUmoh/pontiff-protocol.git
```

### Error: "fatal: refusing to merge unrelated histories"

```bash
# If remote has existing content, force push (CAREFUL!)
git push -u origin main --force

# Or pull and merge first (safer)
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "Permission denied (publickey)"

**Solution:**
- Use HTTPS instead of SSH
- Or set up SSH key correctly (see Step 6, Option B)

### Error: "Large files detected"

```bash
# Remove large files from git history
git rm --cached path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore

# Commit and push
git commit -m "Remove large files"
git push
```

---

**Ready to push?** Let me know and I'll help you execute these steps!
