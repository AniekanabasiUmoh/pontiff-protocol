import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { STRATEGIES, AgentStrategy, AgentAction } from './strategies';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const RPS_API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/api/games/rps/play';

// ABI for SessionWallet to execute transfers
const SESSION_WALLET_ABI = [
    "function executeTransaction(address target, uint256 value, bytes calldata data) external returns (bytes memory)",
    "function executeTransfer(address _to, uint256 _amount) external",
    "function getBalance() external view returns (uint256)"
];

// ABI for SessionWalletFactory to get session details
const SESSION_WALLET_FACTORY_ABI = [
    "function sessionsByWallet(address) view returns (address, address, uint256, uint256, uint256, uint256, bool)"
];

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;

export class AgentManagerService {
    private provider: ethers.JsonRpcProvider;
    private pontiffWallet: ethers.Wallet;
    private activeAgents: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.pontiffWallet = new ethers.Wallet(PONTIFF_PRIVATE_KEY, this.provider);
    }

    /**
     * Start the agent loop for a given session
     */
    public async startAgent(sessionId: string, sessionWalletAddress: string, strategy: AgentStrategy) {
        if (this.activeAgents.has(sessionId)) {
            console.log(`Agent for session ${sessionId} is already running.`);
            return;
        }

        console.log(`Starting agent for session ${sessionId} with strategy ${strategy}`);

        // Start the loop
        // Start the loop via recursive function to prevent overlap
        this.runAgentLoop(sessionId, sessionWalletAddress, strategy);
    }

    private async runAgentLoop(sessionId: string, sessionWalletAddress: string, strategy: AgentStrategy) {
        if (!this.activeAgents.has(sessionId)) return;

        try {
            await this.executeAgentTurn(sessionId, sessionWalletAddress, strategy);
        } catch (error) {
            console.error(`Error in agent loop for session ${sessionId}:`, error);
        }

        // Schedule next turn if still active
        if (this.activeAgents.has(sessionId)) {
            const timeoutId = setTimeout(() => {
                this.runAgentLoop(sessionId, sessionWalletAddress, strategy);
            }, 10000); // 10 seconds
            this.activeAgents.set(sessionId, timeoutId);
        }
    }

    /**
     * Stop the agent loop
     */
    public stopAgent(sessionId: string) {
        const timeoutId = this.activeAgents.get(sessionId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeAgents.delete(sessionId);
            console.log(`Stopped agent for session ${sessionId}`);
        }
    }

    /**
     * Execute a single turn for the agent
     */
    private async executeAgentTurn(sessionId: string, sessionWalletAddress: string, strategyName: AgentStrategy) {
        // 1. Check if session is still active in DB
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !session || session.status !== 'active') {
            console.log(`Session ${sessionId} is not active. Stopping agent.`);
            this.stopAgent(sessionId);
            return;
        }

        // 2. Check expiry
        if (session.expires_at && new Date() > new Date(session.expires_at)) {
            console.log(`Session ${sessionId} expired at ${session.expires_at}. Stopping agent.`);
            await this.updateSessionStatus(sessionId, 'expired');
            this.stopAgent(sessionId);
            return;
        }

        // 3. Check balance and stop loss
        const sessionWalletContract = new ethers.Contract(sessionWalletAddress, SESSION_WALLET_ABI, this.pontiffWallet);
        const balanceBigInt = await sessionWalletContract.getBalance();
        const balance = Number(ethers.formatEther(balanceBigInt));

        // Fix: Use <= for stop loss
        if (balance <= session.stop_loss) {
            console.log(`Stop loss triggered for session ${sessionId}. Balance: ${balance}, Stop Loss: ${session.stop_loss}`);
            await this.updateSessionStatus(sessionId, 'stopped');
            this.stopAgent(sessionId);
            return;
        }

        // Fix: Add Take Profit check
        if (session.take_profit && balance >= session.take_profit) {
            console.log(`Take profit triggered for session ${sessionId}. Balance: ${balance}, Take Profit: ${session.take_profit}`);
            await this.updateSessionStatus(sessionId, 'stopped');
            this.stopAgent(sessionId);
            return;
        }

        // 3. Update balance in DB
        await supabase
            .from('agent_sessions')
            .update({ current_balance: balance })
            .eq('id', sessionId);


        // 4. Decide on action
        const strategy = STRATEGIES[strategyName];
        if (!strategy) {
            console.error(`Unknown strategy: ${strategyName}`);
            return;
        }

        // Fetch game history for strategy analysis
        const { data: historyData } = await supabase
            .from('game_history')
            .select('*')
            .eq('player_address', sessionWalletAddress.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(10);

        const gameHistory = (historyData || []).map(game => ({
            outcome: game.result === 'win' ? 'WIN' : game.result === 'loss' ? 'LOSS' : 'DRAW',
            playerMove: game.player_move || 1,
            pontiffMove: game.pontiff_move || 1,
            wager: parseFloat(game.wager || '0'),
            timestamp: new Date(game.created_at).getTime()
        }));

        const context = {
            gameHistory,
            currentBalance: balance,
            lastGameResult: gameHistory[0]?.outcome,
            gamesPlayed: session.games_played || 0
        };

        const action = strategy(context);
        console.log(`Strategy decision for ${sessionId}: ${action.reasoning || 'No reasoning provided'}`);

        // 5. Execute Action (Play Game)
        // 5. Execute Action
        if (action.wager > balance) {
            console.warn(`Agent ${sessionId} attempted to wager ${action.wager} but only has ${balance}. Skipping turn.`);
            return;
        }

        if (action.game === 'RPS') {
            await this.playRPS(sessionId, sessionWalletAddress, action);
        } else if (action.game === 'STAKING') {
            await this.stakeTokens(sessionId, sessionWalletAddress, action);
        }
    }

    private async playRPS(sessionId: string, sessionWalletAddress: string, action: AgentAction) {
        console.log(`Agent ${sessionId} playing RPS. Move: ${action.move}, Wager: ${action.wager}`);

        try {
            const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS;
            const rpsContractAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS;

            if (!guiltTokenAddress || !rpsContractAddress) {
                console.error("Missing contract addresses");
                return;
            }

            const wagerAmount = ethers.parseEther(action.wager.toString());
            const sessionWallet = new ethers.Contract(sessionWalletAddress, SESSION_WALLET_ABI, this.pontiffWallet);

            // Interfaces for encoding data
            const erc20Interface = new ethers.Interface([
                "function approve(address spender, uint256 amount) external returns (bool)"
            ]);

            const rpsInterface = new ethers.Interface([
                "function playRPS(uint8 _playerMove, uint256 _wager) external returns (uint256)"
            ]);

            // 1. Approve RPS Contract
            const approveData = erc20Interface.encodeFunctionData("approve", [rpsContractAddress, wagerAmount]);
            console.log(`Agent ${sessionId} approving RPS contract...`);

            const approveTxData = await sessionWallet.executeTransaction.populateTransaction(
                guiltTokenAddress,
                0,
                approveData
            );

            // We need to send this transaction via the Pontiff wallet
            const approveTx = await this.pontiffWallet.sendTransaction({
                to: sessionWalletAddress,
                data: approveTxData.data,
                gasLimit: 300000 // Estimated gas
            });
            await approveTx.wait();

            // 2. Play RPS
            const playData = rpsInterface.encodeFunctionData("playRPS", [action.move, wagerAmount]);
            console.log(`Agent ${sessionId} executing playRPS...`);

            const playTxData = await sessionWallet.executeTransaction.populateTransaction(
                rpsContractAddress,
                0,
                playData
            );

            const playTx = await this.pontiffWallet.sendTransaction({
                to: sessionWalletAddress,
                data: playTxData.data,
                gasLimit: 500000
            });

            const receipt = await playTx.wait();
            console.log(`Game played in tx: ${receipt ? receipt.hash : 'unknown'}`);

            // Update games played count
            await supabase.rpc('increment_games_played', { session_id: sessionId });

        } catch (e) {
            console.error("Failed to play RPS:", e);
        }
    }

    private async updateSessionStatus(sessionId: string, status: 'active' | 'stopped' | 'expired') {
        await supabase
            .from('agent_sessions')
            .update({ status })
            .eq('id', sessionId);
    }

    private async stakeTokens(sessionId: string, sessionWalletAddress: string, action: AgentAction) {
        console.log(`Agent ${sessionId} staking tokens. Amount: ${action.wager}`);

        try {
            const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS;
            const stakingAddress = process.env.NEXT_PUBLIC_STAKING_ADDRESS;

            if (!guiltTokenAddress || !stakingAddress) {
                console.error("Missing contract addresses for staking");
                return;
            }

            const stakeAmount = ethers.parseEther(action.wager.toString());
            const sessionWallet = new ethers.Contract(sessionWalletAddress, SESSION_WALLET_ABI, this.pontiffWallet);

            const erc20Interface = new ethers.Interface([
                "function approve(address spender, uint256 amount) external returns (bool)"
            ]);

            const stakingInterface = new ethers.Interface([
                "function stake(uint256 amount) external"
            ]);

            // 1. Approve
            const approveData = erc20Interface.encodeFunctionData("approve", [stakingAddress, stakeAmount]);
            const approveTxData = await sessionWallet.executeTransaction.populateTransaction(guiltTokenAddress, 0, approveData);
            const approveTx = await this.pontiffWallet.sendTransaction({
                to: sessionWalletAddress,
                data: approveTxData.data,
                gasLimit: 300000
            });
            await approveTx.wait();

            // 2. Stake
            const stakeData = stakingInterface.encodeFunctionData("stake", [stakeAmount]);
            const stakeTxData = await sessionWallet.executeTransaction.populateTransaction(stakingAddress, 0, stakeData);
            const stakeTx = await this.pontiffWallet.sendTransaction({
                to: sessionWalletAddress,
                data: stakeTxData.data,
                gasLimit: 500000
            });
            await stakeTx.wait();
            console.log(`Staked tokens for session ${sessionId}`);
        } catch (e) {
            console.error("Failed to stake tokens:", e);
        }
    }
}
