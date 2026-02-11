# 🚀 THE PONTIFF - PRODUCTION DEPLOYMENT GUIDE

Complete step-by-step deployment checklist for launching The Pontiff to production.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Setup
- [ ] All `.env` files configured with production values
- [ ] API keys secured (Google Gemini, Twitter, Supabase)
- [ ] RPC endpoints tested (Monad mainnet)
- [ ] Contract addresses updated (GUILT, Staking, Judas, Indulgence)
- [ ] Redis instance running and accessible
- [ ] Supabase project configured with production settings

### 2. Testing
- [ ] All unit tests passing (`yarn test`)
- [ ] Integration tests passing
- [ ] Load tests completed (API, WebSocket, Betrayal spam)
- [ ] Smart contracts audited (or acknowledged risk)
- [ ] Frontend tested on all browsers (Chrome, Firefox, Safari, Brave)
- [ ] Mobile responsive design verified

### 3. Security
- [ ] Rate limiting configured
- [ ] CORS properly restricted to production domains
- [ ] Input validation on all endpoints
- [ ] SQL injection tests passed
- [ ] XSS prevention verified
- [ ] API keys rotated if previously exposed
- [ ] SSL certificates configured (HTTPS enforced)

---

## 🔗 SMART CONTRACT DEPLOYMENT

### Deploy to Monad Mainnet

1. **Update Deployment Script**
   ```bash
   cd packages/contracts
   # Edit script/DeployMainnet.s.sol
   # Set TREASURY, TEAM, AIRDROP, OWNER addresses
   ```

2. **Deploy Contracts**
   ```bash
   forge script script/DeployMainnet.s.sol:DeployMainnet \
     --rpc-url $MONAD_RPC_URL \
     --private-key $DEPLOYER_PRIVATE_KEY \
     --broadcast \
     --verify
   ```

3. **Verify Deployment**
   - [ ] GuiltToken deployed ✅
   - [ ] Staking Cathedral deployed ✅
   - [ ] Judas Protocol deployed ✅
   - [ ] Indulgence NFT deployed ✅
   - [ ] All contracts verified on MonadScan

4. **Initialize Contracts**
   ```bash
   # Set AMM pair for tax routing
   cast send $GUILT_ADDRESS "setAMMPair(address,bool)" $UNISWAP_PAIR true

   # Exempt contracts from tax
   cast send $GUILT_ADDRESS "setTaxExempt(address,bool)" $STAKING_ADDRESS true
   cast send $GUILT_ADDRESS "setTaxExempt(address,bool)" $INDULGENCE_ADDRESS true
   ```

5. **Add Liquidity**
   - [ ] Create GUILT/MON pair on Uniswap or nad.fun
   - [ ] Add initial liquidity (60% of supply)
   - [ ] Lock liquidity (if applicable)

---

## 🐳 DOCKER DEPLOYMENT

### Build Docker Images

```bash
# Build API image
docker build -t pontiff-api:latest -f apps/api/Dockerfile apps/api

# Build Web image
docker build -t pontiff-web:latest -f apps/web/Dockerfile apps/web

# Test locally
docker-compose up
```

### Push to Registry

```bash
# Tag images
docker tag pontiff-api:latest your-registry/pontiff-api:latest
docker tag pontiff-web:latest your-registry/pontiff-web:latest

# Push
docker push your-registry/pontiff-api:latest
docker push your-registry/pontiff-web:latest
```

---

## ☁️ CLOUD DEPLOYMENT

### Option 1: Railway

1. **API Deployment**
   ```bash
   railway login
   railway init
   railway up --service api
   ```

2. **Frontend Deployment to Vercel**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Environment Variables**
   - Set all env vars in Railway dashboard
   - Update Vercel environment variables

### Option 2: AWS/DigitalOcean

1. **Provision Infrastructure**
   - [ ] Create EC2/Droplet instances
   - [ ] Configure security groups (ports 3000, 3001, 6379)
   - [ ] Set up load balancer
   - [ ] Configure auto-scaling

2. **Deploy with Docker Compose**
   ```bash
   scp docker-compose.yml user@server:/app/
   ssh user@server
   cd /app
   docker-compose up -d
   ```

---

## 🗄️ DATABASE SETUP

### Supabase Production

1. **Run Migrations**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Seed Initial Data**
   ```bash
   npm run seed:content
   ```

3. **Configure Storage**
   - [ ] Create `writs/` bucket (public)
   - [ ] Create `certificates/` bucket (public)
   - [ ] Set CORS policies

4. **Enable RLS (Row Level Security)**
   - [ ] Lock down sensitive tables
   - [ ] Test access policies

---

## 🔍 MONITORING SETUP

### Error Tracking (Sentry)

```bash
# Install Sentry SDK (already in package.json)
# Configure DSN in .env
SENTRY_DSN=https://...@sentry.io/...
```

### Logging

- [ ] Winston logs configured
- [ ] Log rotation enabled
- [ ] CloudWatch/Datadog integration (optional)

### Health Checks

- [ ] `/health` endpoint returns 200
- [ ] `/metrics` endpoint accessible
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)

---

## 🚦 GO LIVE

### Final Checks

- [ ] All services healthy
- [ ] Frontend loads at production URL
- [ ] Wallet connection works
- [ ] Contract interactions work (stake, betray, absolve)
- [ ] WebSocket real-time updates working
- [ ] Leaderboards populated
- [ ] Error tracking functional

### Launch Sequence

1. **Soft Launch (Internal Testing)**
   - Deploy to production
   - Test with team wallets
   - Monitor for 1 hour

2. **Public Announcement**
   ```
   🎉 THE PONTIFF IS LIVE 🎉

   Confess your crypto sins at:
   https://pontiff.xyz

   Features:
   ⛪ AI-powered sin scanning
   💀 Medieval roasts
   🎭 Betrayal game theory
   🏆 Hall of Shame leaderboard

   #Monad #MonadHackathon #DeFi

   [Include demo video/GIF]
   ```

3. **Monitor Launch**
   - Watch error logs
   - Monitor API response times
   - Track user signups
   - Respond to Twitter mentions

---

## 📊 POST-LAUNCH

### Week 1
- [ ] Daily health checks
- [ ] Monitor user feedback
- [ ] Fix critical bugs immediately
- [ ] Tweet daily stats (users, sins, biggest loser)

### Week 2-4
- [ ] Roll out advanced features (Crusades, Prophecy)
- [ ] Run first weekly competition
- [ ] Collect user testimonials
- [ ] Submit hackathon final report

---

## 🆘 TROUBLESHOOTING

### Common Issues

**Frontend won't connect to contracts:**
- Check `NEXT_PUBLIC_*` env vars
- Verify RPC URL is correct
- Ensure wallet is on Monad network

**API errors:**
- Check Redis connection
- Verify Supabase credentials
- Review rate limit settings
- Check Gemini API quota

**Transactions failing:**
- Verify contract addresses
- Check gas settings
- Ensure user has sufficient balance
- Review contract logs on MonadScan

---

## 📞 SUPPORT

- **GitHub Issues:** https://github.com/your-repo/issues
- **Discord:** [Your Discord]
- **Twitter:** @ThePontiff

---

## ✅ DEPLOYMENT COMPLETE!

Congratulations! The Pontiff is now live. May your roasts be savage and your $GUILT flow eternal. ⛪🔥
