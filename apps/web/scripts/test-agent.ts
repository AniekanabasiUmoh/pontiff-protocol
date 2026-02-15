import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_WALLET_ABI = [
    "function getBalance() external view returns (uint256)",
    "function owner() external view returns (address)"
];

async function testAgent() {
    console.log('🧪 Testing Agent Functionality\n');

    // Get the agent
    const { data: session, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .not('session_wallet', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !session) {
        console.error('❌ No agent found with session_wallet');
        return;
    }

    console.log('Agent Details:');
    console.log(`   ID: ${session.id}`);
    console.log(`   User: ${session.user_wallet}`);
    console.log(`   Session Wallet: ${session.session_wallet}`);
    console.log(`   Strategy: ${session.strategy}`);
    console.log(`   Deposit: ${session.deposit_amount || session.starting_balance}`);
    console.log('');

    // Test 1: Can we connect to the session wallet?
    console.log('Test 1: Connecting to session wallet...');
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    const sessionWallet = new ethers.Contract(
        session.session_wallet,
        SESSION_WALLET_ABI,
        provider
    );

    try {
        const owner = await sessionWallet.owner();
        console.log(`   ✅ Session wallet owner: ${owner}`);
        console.log(`   ✅ Matches user: ${owner.toLowerCase() === session.user_wallet.toLowerCase()}`);
    } catch (e: any) {
        console.error(`   ❌ Failed to read owner:`, e.message);
        return;
    }

    // Test 2: Can we read the balance?
    console.log('\nTest 2: Reading GUILT balance...');
    try {
        const balanceBigInt = await sessionWallet.getBalance();
        const balance = ethers.formatEther(balanceBigInt);
        console.log(`   ✅ Current balance: ${balance} GUILT`);

        if (parseFloat(balance) === 0) {
            console.log(`   ⚠️  Balance is 0! Agent needs GUILT tokens to play.`);
            console.log(`   💡 Transfer GUILT to session wallet: ${session.session_wallet}`);
        }
    } catch (e: any) {
        console.error(`   ❌ Failed to read balance:`, e.message);
        return;
    }

    // Test 3: Check if Pontiff wallet is set
    console.log('\nTest 3: Checking Pontiff configuration...');
    const pontiffKey = process.env.PONTIFF_PRIVATE_KEY;
    if (!pontiffKey) {
        console.error('   ❌ PONTIFF_PRIVATE_KEY not set!');
        return;
    }
    const pontiffWallet = new ethers.Wallet(pontiffKey, provider);
    console.log(`   ✅ Pontiff wallet: ${pontiffWallet.address}`);

    // Test 4: Check RPS contract
    console.log('\nTest 4: Checking RPS contract...');
    const rpsAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS;
    if (!rpsAddress) {
        console.error('   ❌ RPS_CONTRACT_ADDRESS not set!');
        return;
    }
    console.log(`   ✅ RPS contract: ${rpsAddress}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Session wallet exists and is accessible');
    console.log('✅ Can read balance from session wallet');
    console.log('✅ Pontiff wallet configured');
    console.log('✅ RPS contract configured');
    console.log('');

    const balanceBigInt = await sessionWallet.getBalance();
    const balance = parseFloat(ethers.formatEther(balanceBigInt));

    if (balance > 0) {
        console.log('🎉 AGENT IS READY TO PLAY!');
        console.log('   Run: npx tsx scripts/start-my-agent.ts');
    } else {
        console.log('⚠️  AGENT NEEDS FUNDS');
        console.log('   Transfer GUILT tokens to:');
        console.log(`   ${session.session_wallet}`);
        console.log('   Then run: npx tsx scripts/start-my-agent.ts');
    }
}

testAgent().catch(console.error);
