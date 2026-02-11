# Phase 1 Setup Guide

## ✅ Completed

Phase 1 (Project Initialization) is complete! Here's what was created:

### Project Structure
```
pontiff/
├── apps/
│   ├── web/          # Next.js 14 frontend (TypeScript + Tailwind)
│   └── api/          # Express backend (Scanner, Roaster, Social)
├── packages/
│   └── contracts/    # Foundry smart contracts
├── docs/             # Documentation
├── supabase/         # Database migrations
└── .github/          # CI/CD workflows
```

### Files Created
- ✅ Monorepo configuration (Turbo + Workspaces)
- ✅ Next.js frontend scaffold
- ✅ Express API server skeleton
- ✅ GuiltToken.sol smart contract
- ✅ GitHub Actions lint workflow
- ✅ Environment template (.env.example)
- ✅ Supabase schema (migration + docs)
- ✅ Comprehensive README

## 🔧 Next Steps - Setup Instructions

### 1. Install Dependencies

**Option A: Install without canvas** (recommended for now)
```bash
# Install root dependencies
npm install turbo --save-dev

# Install frontend dependencies
cd apps/web
npm install

# Skip API for now (canvas issue on Windows)
```

**Option B: Fix canvas dependency** (if needed for Phase 4)
```bash
# Install windows-build-tools (PowerShell as Admin)
npm install --global windows-build-tools

# Then retry
cd apps/api
npm install
```

### 2. Setup Supabase Database

You have 3 options:

#### **Option A: Via Supabase Dashboard (Easiest)**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from: `supabase/migrations/00001_initial_schema.sql`
4. Paste and run it
5. Done! ✅

#### **Option B: Via Supabase CLI**
```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (you'll need your project ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

#### **Option C: I can provide the exact SQL commands**
Just let me know and I'll give you the complete SQL to run.

### 3. Setup Environment Variables

```bash
# Copy the template
cp .env.example .env

# Edit .env and fill in:
# - ANTHROPIC_API_KEY (for Claude)
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)
# - MONAD_RPC_URL (will use default: https://testnet-rpc.monad.xyz)
```

### 4. Test the Setup

```bash
# Test frontend
cd apps/web
npm run dev
# Visit: http://localhost:3000

# Test API (once canvas is sorted)
cd apps/api
npm run dev
# Visit: http://localhost:3001/health
```

## 📋 What We Need From You

1. **Supabase Setup**: Which option do you prefer?
   - Dashboard (copy/paste SQL)
   - CLI (I can guide you)
   - Just give me the SQL to run manually

2. **API Keys**: Do you have these ready?
   - Anthropic API key
   - Supabase credentials
   - Twitter API (can wait for Phase 5)

3. **Ready for Phase 2?** Once Supabase is set up, we can start building:
   - RPC connection to Monad
   - Wallet scanner
   - Sin classification logic

## 🎯 Phase 1 Status: COMPLETE ✅

All infrastructure is in place. Ready to build the scanner!
