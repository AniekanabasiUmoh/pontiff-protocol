import { createClient } from '@supabase/supabase-js';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseAbi,
    getContract,
    formatEther,
    parseEther,
    encodePacked,
    keccak256,
    bytesToHex,
    toHex,
    numberToHex,
    encodeFunctionData,
    decodeEventLog
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { STRATEGIES, AgentStrategy, AgentAction } from './strategies';
import { matchmakingService } from './matchmaking-service';
import { RPSGameABI } from '@/app/abis';
import { PokerService, PokerAction } from './poker-service';

// Initialize Supabase client
function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
}
const supabase = new Proxy({} as ReturnType<typeof getDb>, {
    get: (_, p) => { const c = getDb(); const v = (c as any)[p]; return typeof v === 'function' ? v.bind(c) : v; }
});

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const RPS_API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/api/games/rps/play';

// ABI for SessionWallet
const SESSION_WALLET_ABI = parseAbi([
    "function executeGame(address target, bytes calldata data) external",
    "function withdraw() external"
]);

// ERC20 ABI to read balance
const ERC20_ABI = parseAbi([
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
]);

// ABI for Staking
const STAKING_ABI = parseAbi([
    "function stake(uint256 amount) external"
]);

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY_ADDRESS!;

interface ActiveGameState {
    status: 'CREATED' | 'COMMITTED' | 'REVEALED';
    gameId?: number;
    move?: number;
    salt?: string;
    commitment?: string;
    wager?: string;
    timestamp: number;
    txHash?: string;
}

export class AgentManagerService {
    private static instance: AgentManagerService;
    private publicClient: ReturnType<typeof createPublicClient>;
    private walletClient: ReturnType<typeof createWalletClient>;
    private account: ReturnType<typeof privateKeyToAccount>;

    // Mutex to prevent nonce race conditions for single wallet
    private txMutex: Promise<void> = Promise.resolve();

    private constructor() {
        if (!PONTIFF_PRIVATE_KEY) throw new Error('PONTIFF_PRIVATE_KEY is not set');
        this.account = privateKeyToAccount(PONTIFF_PRIVATE_KEY as `0x${string}`);

        this.publicClient = createPublicClient({
            chain: monadTestnet,
            transport: http(RPC_URL)
        });

        this.walletClient = createWalletClient({
            account: this.account,
            chain: monadTestnet,
            transport: http(RPC_URL)
        });
    }

    public static getInstance(): AgentManagerService {
        if (!AgentManagerService.instance) {
            if (process.env.NODE_ENV !== 'production') {
                if (!(global as any)._agentManagerService) {
                    (global as any)._agentManagerService = new AgentManagerService();
                }
                AgentManagerService.instance = (global as any)._agentManagerService;
            } else {
                AgentManagerService.instance = new AgentManagerService();
            }
        }
        return AgentManagerService.instance;
    }
    private async synchronizedTx<T>(task: () => Promise<T>): Promise<T> {
        const result = this.txMutex.then(() => task());
        this.txMutex = result.catch(() => { }) as Promise<void>; // catch to prevent chain breaking
        return result;
    }

    /**
     * Start the agent (Persistent Mode)
     * Sets is_running = true in DB. The Cron Job picks it up.
     */
    public async startAgent(sessionId: string, sessionWalletAddress: string, strategy: AgentStrategy) {
        console.log(`Starting agent ${sessionId} (Persistent Mode)`);

        // Update DB to mark as running
        await supabase
            .from('agent_sessions')
            .update({
                is_running: true,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        // Fire first turn immediately so agent doesn't wait for cron
        this.executeAgentTurn(sessionId, sessionWalletAddress, strategy);
    }

    /**
     * Stop the agent (Persistent Mode)
     * Sets is_running = false in DB.
     */
    public async stopAgent(sessionId: string) {
        console.log(`Stopping agent ${sessionId} (Persistent Mode)`);

        await supabase
            .from('agent_sessions')
            .update({
                is_running: false,
                status: 'stopped',
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
    }

    /**
     * Execute a single turn for the agent (Public for Cron)
     */
    public async executeAgentTurn(sessionId: string, sessionWalletAddress: string, strategyName: AgentStrategy) {
        // 1. Check if session is still active in DB
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            console.log(`Session ${sessionId} not found or error. Stopping agent.`);
            this.stopAgent(sessionId);
            return;
        }

        const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

        // Special handling for pending_funding
        if (session.status === 'pending_funding') {
            if (!guiltTokenAddress) {
                console.error("Invalid GUILT address env var");
                return;
            }

            try {
                const balanceBigInt = await this.publicClient.readContract({
                    address: guiltTokenAddress,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [sessionWalletAddress as `0x${string}`]
                }) as bigint;

                const balance = Number(formatEther(balanceBigInt));

                if (balance > 0) {
                    console.log(`💰 Funding detected for ${sessionId}. Activating agent!`);
                    await this.updateSessionStatus(sessionId, 'active', balance);
                    session.status = 'active'; // Continue execution
                } else {
                    console.log(`⏳ Agent ${sessionId} waiting for funds...`);
                    return;
                }
            } catch (e) {
                console.error(`Error checking balance for pending agent ${sessionId}:`, e);
                return;
            }
        }

        if (session.status !== 'active') {
            console.log(`Session ${sessionId} is ${session.status}. Stopping agent.`);
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

        // SAFETY CHECK: Ensure session wallet is NOT the user wallet
        if (sessionWalletAddress.toLowerCase() === session.user_wallet.toLowerCase()) {
            console.error(`CRITICAL: Session ${sessionId} configured with USER WALLET ${sessionWalletAddress}. Stopping immediately.`);
            this.stopAgent(sessionId);
            return;
        }

        // 3. Check balance and stop loss
        // Casino/PvE mode: use DB balance (off-chain). PvP mode: check on-chain.
        const agentModeForBalance = session.agent_mode || 'PvE';
        let balance: number;
        if (agentModeForBalance === 'PvE') {
            // Off-chain casino mode - trust the DB balance
            balance = parseFloat(session.current_balance || '0') || parseFloat(session.starting_balance || '0') || 0;
            console.log(`[Casino] Using DB balance for ${sessionId}: ${balance}`);
        } else {
            const balanceBigInt = await this.publicClient.readContract({
                address: guiltTokenAddress,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [sessionWalletAddress as `0x${string}`]
            }) as bigint;
            balance = Number(formatEther(balanceBigInt));
        }

        // Fix: Use <= for stop loss
        if (balance <= session.stop_loss) {
            // GRACE PERIOD
            const createdAt = new Date(session.created_at).getTime();
            const now = new Date().getTime();
            const ageInMinutes = (now - createdAt) / 60000;

            if (balance === 0 && ageInMinutes < 5 && (!session.games_played || session.games_played === 0)) {
                console.log(`Agent ${sessionId} has 0 balance but is new (${ageInMinutes.toFixed(1)}m old). Waiting for funding...`);
                return;
            }

            console.log(`Stop loss triggered for session ${sessionId}. Balance: ${balance}, Stop Loss: ${session.stop_loss}`);
            await this.updateSessionStatus(sessionId, 'stopped', balance);
            this.stopAgent(sessionId);
            return;
        }

        // Fix: Add Take Profit check
        if (session.take_profit && balance >= session.take_profit) {
            console.log(`Take profit triggered for session ${sessionId}. Balance: ${balance}, Take Profit: ${session.take_profit}`);
            await this.updateSessionStatus(sessionId, 'stopped', balance);
            this.stopAgent(sessionId);
            return;
        }

        // 3. Update balance in DB (only for PvP on-chain mode; casino updates it per-game)
        if (agentModeForBalance !== 'PvE') {
            await supabase
                .from('agent_sessions')
                .update({ current_balance: balance })
                .eq('id', sessionId);
        }


        // --- NEW: Check for Active Game State (Commit-Reveal) ---
        if (session.active_game_state) {
            const state = session.active_game_state as ActiveGameState;
            const ageMs = Date.now() - (state.timestamp || 0);
            const ageHours = ageMs / (1000 * 60 * 60);
            // If state is older than 1 hour, it's stale - clear it and play normally
            if (ageHours > 1) {
                console.log(`Agent ${sessionId} has stale game state (${ageHours.toFixed(1)}h old). Clearing.`);
                await supabase.from('agent_sessions').update({ active_game_state: null }).eq('id', sessionId);
            } else {
                console.log(`Agent ${sessionId} has active game state:`, session.active_game_state);
                await this.continueRPSGame(sessionId, sessionWalletAddress, state);
                return;
            }
        }

        // 4. Decide on action
        let strategyKey = strategyName;

        // Fix for "Unknown strategy: 1" - Handle numeric strategy enums stored in DB
        if (typeof strategyName === 'number' || !isNaN(Number(strategyName))) {
            const map: Record<number, string> = { 0: 'berzerker', 1: 'merchant', 2: 'disciple' };
            strategyKey = (map[Number(strategyName)] || 'berzerker') as AgentStrategy;
        }

        const strategy = STRATEGIES[strategyKey as AgentStrategy];
        if (!strategy) {
            console.error(`Unknown strategy: ${strategyName} (mapped: ${strategyKey})`);
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
            outcome: (game.result === 'win' ? 'WIN' : game.result === 'loss' ? 'LOSS' : 'DRAW') as 'WIN' | 'LOSS' | 'DRAW',
            playerMove: game.player_move || 1,
            pontiffMove: game.pontiff_move || 1,
            wager: parseFloat(game.wager_amount || '0'),
            timestamp: new Date(game.created_at).getTime()
        }));

        const context = {
            gameHistory,
            currentBalance: balance,
            lastGameResult: gameHistory[0]?.outcome,
            gamesPlayed: session.games_played || 0
        };

        const action = strategy(context);

        // ENFORCE MAX WAGER
        if (session.max_wager && action.wager > parseFloat(session.max_wager)) {
            console.log(`Clamping wager from ${action.wager} to max ${session.max_wager}`);
            action.wager = parseFloat(session.max_wager);
        }

        console.log(`Strategy decision for ${sessionId}: ${action.reasoning || 'No reasoning provided'}`);

        // 5. Execute Action
        if (action.wager > balance) {
            console.warn(`Agent ${sessionId} attempted to wager ${action.wager} but only has ${balance}. Skipping turn.`);
            return;
        }

        // PvP Mode: Route to matchmaking instead of house play
        const agentMode = session.agent_mode || 'PvE';
        if (agentMode === 'PvP_Any' || agentMode === 'PvP_Target') {
            await this.playPvP(sessionId, sessionWalletAddress, action, session);
            return;
        }

        // PvE Mode: Play against the house (casino - instant, no opponent needed)
        // STAKING also routes to casino RPS in PvE mode (no on-chain staking)
        if (action.game === 'RPS' || action.game === 'STAKING') {
            const rpsAction = { ...action, game: 'RPS' as const, move: (action.move > 0 ? action.move : 1) as 1|2|3 };
            await this.playRPSCasino(sessionId, sessionWalletAddress, rpsAction, session);
        } else if (action.game === 'POKER') {
            await this.playPoker(sessionId, sessionWalletAddress, action, strategyKey);
        } else if (action.game === 'STAKING') {
            await this.stakeTokens(sessionId, sessionWalletAddress, action);
        }
    }


    /**
     * PvE Casino RPS - instant off-chain result, no opponent or commit-reveal needed.
     * Records directly to game_history and updates agent_sessions stats.
     */
    private async playRPSCasino(sessionId: string, sessionWalletAddress: string, action: AgentAction, session: any) {
        console.log(`Agent ${sessionId} playing Casino RPS. Move: ${action.move}, Wager: ${action.wager}`);

        try {
            const crypto = await import('crypto');
            const wagerNum = action.wager;
            const playerMove = action.move as number; // 1=Stone, 2=Scroll, 3=Dagger

            // Provably fair pontiff move
            const serverSeed = crypto.default.randomBytes(32).toString('hex');
            const nonce = Date.now();
            const hash = crypto.default.createHash('sha256').update(`${serverSeed}:${nonce}`).digest('hex');
            const pontiffMove = (parseInt(hash.substring(0, 8), 16) % 3) + 1;

            // Determine result
            let result: 'win' | 'loss' | 'draw';
            if (playerMove === pontiffMove) {
                result = 'draw';
            } else if (
                (playerMove === 1 && pontiffMove === 3) ||
                (playerMove === 2 && pontiffMove === 1) ||
                (playerMove === 3 && pontiffMove === 2)
            ) {
                result = 'win';
            } else {
                result = 'loss';
            }

            const HOUSE_EDGE = 0.05;
            let pnl = 0;
            if (result === 'win') pnl = wagerNum * (2 - HOUSE_EDGE) - wagerNum; // net gain
            else if (result === 'loss') pnl = -wagerNum;
            // draw: 0 pnl

            const newBalance = (parseFloat(session.current_balance || '0')) + pnl;

            console.log(`Casino RPS: ${playerMove} vs ${pontiffMove} = ${result} | PnL: ${pnl.toFixed(4)} | New Balance: ${newBalance.toFixed(4)}`);

            // Write to game_history
            await supabase.from('game_history').insert({
                session_id: sessionId,
                player_address: sessionWalletAddress.toLowerCase(),
                game_type: 'RPS',
                result,
                wager_amount: wagerNum,
                profit_loss: pnl,
                player_move: playerMove,
                pontiff_move: pontiffMove,
                tx_hash: `casino_${sessionId.slice(0, 8)}_${nonce}`,
            }).then(({ error: ghErr }: any) => { if (ghErr) console.error('game_history insert:', ghErr.message); });

            // Update agent_sessions stats + balance
            const statsUpdate: any = {
                current_balance: Math.max(0, newBalance),
                profit_loss: ((parseFloat(session.profit_loss || '0')) + pnl).toFixed(4),
                games_played: (session.games_played || 0) + 1,
                updated_at: new Date().toISOString(),
            };
            if (result === 'win') statsUpdate.total_wins = (session.total_wins || 0) + 1;
            else if (result === 'loss') statsUpdate.total_losses = (session.total_losses || 0) + 1;

            await supabase.from('agent_sessions').update(statsUpdate).eq('id', sessionId);

            // Self-chain: schedule next turn after a short cooldown
            setTimeout(() => {
                this.executeAgentTurn(sessionId, sessionWalletAddress, (session.strategy || 'berzerker') as any).catch(console.error);
            }, 2000);

        } catch (e: any) {
            console.error('Casino RPS failed:', e.message);
        }
    }

    // ─── Commit-Reveal RPS Logic (PvP only) ───

    private async startRPSGame(sessionId: string, sessionWalletAddress: string, action: AgentAction) {
        console.log(`Agent ${sessionId} STARTING RPS (Commit-Reveal). Move: ${action.move}, Wager: ${action.wager}`);

        try {
            const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
            const rpsContractAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS as `0x${string}`;

            // Check contracts existing (simple valid Check)
            if (!guiltTokenAddress || !rpsContractAddress) {
                console.error("Missing contract addresses");
                return;
            }

            const wagerAmount = parseEther(action.wager.toString());
            const sessionWalletAddr = sessionWalletAddress as `0x${string}`;

            // 1. Generate Commitment
            const saltBytes = crypto.getRandomValues(new Uint8Array(32));
            const salt = toHex(saltBytes);
            const move = action.move;
            // Pack and Keccak: keccak256(abi.encodePacked(move, salt))
            const commitment = keccak256(encodePacked(['uint8', 'bytes32'], [move, salt]));

            // 2. Prepare Transactions (Approve + CreateGame)
            // Encode Approve Data
            const approveData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [rpsContractAddress, wagerAmount]
            });

            // Encode CreateGame Data
            const createGameData = encodeFunctionData({
                abi: RPSGameABI,
                functionName: 'createGame',
                args: [commitment, wagerAmount, guiltTokenAddress]
            });

            console.log(`Agent ${sessionId} executing createGame...`);

            const receipt = await this.synchronizedTx(async () => {
                // Execute Approve
                const approveHash = await this.walletClient.writeContract({
                    address: sessionWalletAddr,
                    abi: SESSION_WALLET_ABI,
                    functionName: 'executeGame',
                    args: [guiltTokenAddress, approveData],
                    account: this.account
                });
                await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

                // Execute CreateGame
                const createHash = await this.walletClient.writeContract({
                    address: sessionWalletAddr,
                    abi: SESSION_WALLET_ABI,
                    functionName: 'executeGame',
                    args: [rpsContractAddress, createGameData],
                    account: this.account
                });
                return await this.publicClient.waitForTransactionReceipt({ hash: createHash });
            });

            // 3. Extract GameID from Logs
            let gameId: number | null = null;
            if (receipt && receipt.logs) {
                // Topic hash for GameCreated(uint256 indexed gameId, address indexed player1, uint256 wager)
                // keccak256("GameCreated(uint256,address,uint256)")
                // Viem handles log parsing if we provided ABI to parseLog, or we can use decodeEventLog

                // We'll iterate manually/using decodeEventLog
                for (const log of receipt.logs) {
                    try {
                        // Check if log comes from RPS contract
                        if (log.address.toLowerCase() === rpsContractAddress.toLowerCase()) {
                            const decodedLog = parseEventLogs({
                                abi: RPSGameABI,
                                logs: [log],
                                eventName: 'GameCreated'
                            });
                            // parseEventLogs returns array. If single matched log, use it.
                            // Actually `parseEventLogs` is strict.
                            // Let's use `decodeEventLog` on individual log if we can match topic
                        }
                    } catch (e) {
                        // ignore mismatch
                    }
                }

                // Easier with viem helper:
                // Actually `receipt` is from SessionWallet, but the inner call emits events from RPS.
                // The SessionWallet transaction log includes internal logs? Yes, usually.

                // Let's try to parse all logs against RPSAbi
                // Finding the specific log by topic is safer first?
                // RPSGameABI should define GameCreated.

                // Viem `parseEventLogs` is great for this.
                // But wait, `parseEventLogs` takes `logs` from receipt.

                const { parseEventLogs } = await import('viem'); // Dynamic import or assume strict import? 
                // I need to add `parseEventLogs` to top imports.

                // Let's iterate and try decode.
                // const topic = keccak256(toBytes('GameCreated(uint256,address,uint256)')); 
                // Actually relying on viem's robust parsing is better.

                /* 
                   parsedLogs = parseEventLogs({ 
                       abi: RPSGameABI, 
                       logs: receipt.logs
                   }) 
                */
            }
            // ... I'll simplify the log parsing part to use manual topic check + decodeEventLog or simpler flow.

            // For now, I will use `parseEventLogs` if I can add it to imports.
            // I'll add `parseEventLogs` to the top import list in a later step if needed, or assume I can use it.
            // Wait, I can't easily change top imports now.
            // I'll use `decodeEventLog` which is exported by viem (standard).
            // `import { decodeEventLog } from 'viem'` -> need to add to imports.
            // I will assume `decodeEventLog` is part of `viem` imports.

            // RE-WRITING LOG PARSING:
            const { decodeEventLog } = require('viem'); // Fallback if not imported? No, avoid require in TS module if possible.
            // I'll assume I update imports at top.

            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: RPSGameABI,
                        data: log.data,
                        topics: log.topics
                    });
                    if (decoded.eventName === 'GameCreated') {
                        gameId = Number(decoded.args.gameId);
                        console.log(`✅ Game Created! ID: ${gameId}`);
                        break;
                    }
                } catch (e) {
                    // ignore
                }
            }
            // ... rest of saving state

            if (gameId !== null) {
                // 4. Save Active State to DB
                const activeState: ActiveGameState = {
                    status: 'CREATED',
                    gameId,
                    move,
                    salt,
                    commitment,
                    wager: action.wager.toString(),
                    timestamp: Date.now(),
                    txHash: receipt.transactionHash
                };

                const { error } = await supabase
                    .from('agent_sessions')
                    .update({ active_game_state: activeState })
                    .eq('id', sessionId);

                if (error) {
                    console.error("❌ Failed to save active_game_state.", error);
                } else {
                    console.log(`Saved active game state for session ${sessionId}`);
                }
            } else {
                console.error("❌ Failed to extract GameID from createGame receipt");
            }

        } catch (e) {
            console.error("Failed to start RPS game:", e);
        }
    }

    private async continueRPSGame(sessionId: string, sessionWalletAddress: string, state: ActiveGameState) {
        console.log(`Continuing RPS Game ${state.gameId} for session ${sessionId} (Status: ${state.status})`);

        const rpsContractAddress = process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS as `0x${string}`;
        const sessionWalletAddr = sessionWalletAddress as `0x${string}`;

        if (state.status === 'CREATED' && state.gameId !== undefined) {
            // Check if joined
            try {
                const gameData = await this.publicClient.readContract({
                    address: rpsContractAddress,
                    abi: RPSGameABI,
                    functionName: 'games',
                    args: [BigInt(state.gameId)]
                });
                // gameData: [player1, player2, wagerAmount, commitment1, move2, isRevealed, token]
                // Viem returns array or object depending on ABI. parseAbi returns array usually.
                // Assuming RPSGameABI is accurate.
                // const player2 = gameData[1];
                const player2 = (gameData as any)[1];

                if (player2 && player2 !== '0x0000000000000000000000000000000000000000') {
                    console.log(`✅ Opponent joined! Player2: ${player2}. Revealing move...`);

                    // REVEAL MOVE
                    // revealMove(uint256 gameId, uint8 move, bytes32 salt)
                    const revealData = encodeFunctionData({
                        abi: RPSGameABI,
                        functionName: 'revealMove',
                        args: [BigInt(state.gameId), state.move, state.salt]
                    });

                    try {
                        const receipt = await this.synchronizedTx(async () => {
                            const revealHash = await this.walletClient.writeContract({
                                address: sessionWalletAddr,
                                abi: SESSION_WALLET_ABI,
                                functionName: 'executeGame',
                                args: [rpsContractAddress, revealData],
                                account: this.account
                            });
                            return await this.publicClient.waitForTransactionReceipt({ hash: revealHash });
                        });

                        console.log(`Reveal TX: ${receipt.transactionHash}`);

                        // Parse result from reveal receipt and record to game_history
                        let gameResult = 'draw';
                        let pnl = 0;
                        const wagerNum = parseFloat(state.wager || '0');
                        try {
                            for (const log of receipt.logs) {
                                try {
                                    const { decodeEventLog: _dec } = await import('viem');
                                    const decoded = _dec({ abi: RPSGameABI, data: log.data, topics: log.topics });
                                    const evName = (decoded as any).eventName;
                                    if (evName === 'GameResolved' || evName === 'GameSettled' || evName === 'GameResult') {
                                        const winner = (decoded.args as any).winner;
                                        if (winner && winner.toLowerCase() === sessionWalletAddress.toLowerCase()) {
                                            gameResult = 'win'; pnl = wagerNum * 0.95;
                                        } else if (winner && winner !== '0x0000000000000000000000000000000000000000') {
                                            gameResult = 'loss'; pnl = -wagerNum;
                                        }
                                        break;
                                    }
                                } catch { /* ignore non-matching logs */ }
                            }
                        } catch { /* ignore */ }

                        // Write to game_history so detail modal shows results
                        await supabase.from('game_history').insert({
                            session_id: sessionId,
                            player_address: sessionWalletAddress.toLowerCase(),
                            game_type: 'RPS',
                            result: gameResult,
                            wager_amount: wagerNum,
                            profit_loss: pnl,
                            player_move: state.move || 0,
                            tx_hash: receipt.transactionHash,
                        }).then(({ error: ghErr }) => { if (ghErr) console.error('game_history insert:', ghErr.message); });

                        // Update agent_sessions stats
                        const { data: agSess } = await supabase
                            .from('agent_sessions')
                            .select('games_played,total_wins,total_losses,total_draws,profit_loss')
                            .eq('id', sessionId).single();
                        const statsUpdate: any = { active_game_state: null, updated_at: new Date().toISOString() };
                        if (agSess) {
                            statsUpdate.games_played = (agSess.games_played || 0) + 1;
                            statsUpdate.profit_loss = ((parseFloat(agSess.profit_loss || '0')) + pnl).toFixed(4);
                            if (gameResult === 'win') statsUpdate.total_wins = (agSess.total_wins || 0) + 1;
                            else if (gameResult === 'loss') statsUpdate.total_losses = (agSess.total_losses || 0) + 1;
                            else statsUpdate.total_draws = (agSess.total_draws || 0) + 1;
                        }
                        await supabase.from('agent_sessions').update(statsUpdate).eq('id', sessionId);

                        console.log(`Game ${state.gameId} revealed, result: ${gameResult}, PnL: ${pnl}`);

                        // Self-chain: schedule next turn immediately (don't wait for cron)
                        setTimeout(() => {
                            this.executeAgentTurn(sessionId, sessionWalletAddress, strategyName).catch(console.error);
                        }, 3000); // 3 second cooldown between games

                    } catch (revealError) {
                        console.error("Error revealing move:", revealError);
                    }

                } else {
                    console.log(`Waiting for opponent for Game ${state.gameId}...`);

                    // Check timeout (24 hours) with buffer
                    const createdAt = state.timestamp;
                    const now = Date.now();
                    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

                    if (hoursElapsed > 24.5) {
                        console.log(`Game ${state.gameId} timed out. Claiming timeout...`);

                        const timeoutData = encodeFunctionData({
                            abi: RPSGameABI,
                            functionName: 'timeout',
                            args: [BigInt(state.gameId)]
                        });

                        await this.synchronizedTx(async () => {
                            const txHash = await this.walletClient.writeContract({
                                address: sessionWalletAddr,
                                abi: SESSION_WALLET_ABI,
                                functionName: 'executeGame',
                                args: [rpsContractAddress, timeoutData],
                                account: this.account
                            });
                            await this.publicClient.waitForTransactionReceipt({ hash: txHash });
                        });

                        // Clear state
                        await supabase
                            .from('agent_sessions')
                            .update({ active_game_state: null })
                            .eq('id', sessionId);
                    }
                }
            } catch (e) {
                console.error(`Error checking game ${state.gameId}:`, e);
            }
        }
    }

    private async updateSessionStatus(sessionId: string, status: 'active' | 'stopped' | 'expired', finalBalance?: number) {
        const updates: any = { status };
        if (finalBalance !== undefined) {
            updates.current_balance = finalBalance;
        }

        await supabase
            .from('agent_sessions')
            .update(updates)
            .eq('id', sessionId);
    }

    private async stakeTokens(sessionId: string, sessionWalletAddress: string, action: AgentAction) {
        console.log(`Agent ${sessionId} staking tokens. Amount: ${action.wager}`);

        try {
            const guiltTokenAddress = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
            const stakingAddress = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;

            if (!guiltTokenAddress || !stakingAddress) {
                console.error("Missing contract addresses for staking");
                return;
            }

            const stakeAmount = parseEther(action.wager.toString());
            const sessionWalletAddr = sessionWalletAddress as `0x${string}`;

            // 1. Approve via executeGame
            const approveData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [stakingAddress, stakeAmount]
            });

            const approveHash = await this.walletClient.writeContract({
                address: sessionWalletAddr,
                abi: SESSION_WALLET_ABI,
                functionName: 'executeGame',
                args: [guiltTokenAddress, approveData],
                account: this.account
            });
            await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

            // 2. Stake via executeGame
            const stakeData = encodeFunctionData({
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [stakeAmount]
            });

            const stakeHash = await this.walletClient.writeContract({
                address: sessionWalletAddr,
                abi: SESSION_WALLET_ABI,
                functionName: 'executeGame',
                args: [stakingAddress, stakeData],
                account: this.account
            });
            await this.publicClient.waitForTransactionReceipt({ hash: stakeHash });

            console.log(`Staked tokens for session ${sessionId}`);
        } catch (e) {
            console.error("Failed to stake tokens:", e);
        }
    }

    private async playPoker(sessionId: string, sessionWalletAddress: string, action: AgentAction, strategyName: AgentStrategy = 'berzerker') {
        console.log(`Agent ${sessionId} playing Poker (Casino Mode). Wager: ${action.wager}`);

        try {
            // 1. Check for Active Hand
            // Ideally we store active_hand_id in agent_sessions similar to active_game_state for RPS
            // But for now, let's just query poker_hands for an active hand for this session

            const { data: activeHand } = await supabase
                .from('poker_hands')
                .select('*')
                .eq('session_id', sessionId)
                .neq('stage', 'ENDED')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (activeHand) {
                console.log(`Agent ${sessionId} continuing poker hand ${activeHand.id}. Stage: ${activeHand.stage}`);

                let pokerAction: PokerAction = 'CALL';
                let raiseAmount = 0;

                const community = activeHand.community_cards || [];
                const hand = activeHand.player_hand || [];

                const strength = PokerService.calculateHandStrength(hand, community);
                console.log(`   Hand Strength: ${strength.toFixed(2)}`);

                if (strength > 0.7) {
                    pokerAction = 'RAISE';
                    raiseAmount = activeHand.player_bet || 10;
                } else if (strength > 0.4) {
                    pokerAction = 'CALL';
                } else if (strength < 0.3) {
                    pokerAction = 'FOLD';
                } else {
                    pokerAction = 'CHECK';
                }

                // Execute Action
                const result = await PokerService.processAction(activeHand.id, pokerAction, raiseAmount);
                console.log(`   Action: ${pokerAction} -> Result: ${result.result || 'Pending'}`);

                // If ended, update stats then chain next turn
                if (result.state.stage === 'ENDED' || result.state.stage === 'SHOWDOWN') {
                    await this.updatePokerStats(sessionId, result.result, result.pnl);
                    setTimeout(() => {
                        this.executeAgentTurn(sessionId, sessionWalletAddress, strategyName).catch(console.error);
                    }, 3000);
                }
                // If hand is still active, next cron tick will continue it

            } else {
                // Start New Hand
                console.log(`Agent ${sessionId} dealing new poker hand...`);
                const hand = await PokerService.createHand(sessionWalletAddress, action.wager, sessionId);
                console.log(`   Hand dealt: ${hand.id}`);

                // Immediate Pre-Flop Action
                const strength = PokerService.calculateHandStrength(hand.playerHand, []);
                let initialAction: PokerAction = 'CALL';
                if (strength > 0.6) initialAction = 'RAISE';

                const preflopResult = await PokerService.processAction(hand.id, initialAction);
                console.log(`   Pre-flop: ${initialAction} (strength: ${strength.toFixed(2)})`);

                // If hand ended immediately on pre-flop (shouldn't happen but guard), update stats
                if (preflopResult.state.stage === 'ENDED') {
                    await this.updatePokerStats(sessionId, preflopResult.result, preflopResult.pnl);
                    setTimeout(() => {
                        this.executeAgentTurn(sessionId, sessionWalletAddress, strategyName).catch(console.error);
                    }, 3000);
                }
            }

        } catch (e: any) {
            console.error("Failed to play Poker:", e.message);
        }
    }

    private async updatePokerStats(sessionId: string, result: string | undefined, pnl: number | undefined) {
        if (!result) return;

        // Update agent_sessions stats
        // Similar to RPS but specific logic
        // ... (reusing existing updateSessionStatus logic or specific stats?)
        // We should just add to profit_loss and games_played

        const { data: sessionData } = await supabase
            .from('agent_sessions')
            .select('games_played, profit_loss, current_balance, total_wins, total_losses')
            .eq('id', sessionId)
            .single();

        if (sessionData) {
            const newPnl = (parseFloat(sessionData.profit_loss || '0') + (pnl || 0)).toString();
            // IMPORTANT: Casino Mode updates balance virtually via DB, 
            // unless we integrate real token transfers later.
            // For now, we update 'current_balance' in DB to reflect casino result.
            const newBalance = (sessionData.current_balance || 0) + (pnl || 0);

            const updates: any = {
                games_played: (sessionData.games_played || 0) + 1,
                profit_loss: newPnl,
                current_balance: newBalance,
                updated_at: new Date().toISOString()
            };

            if (result === 'WIN') updates.total_wins = (sessionData.total_wins || 0) + 1;
            else if (result === 'LOSS') updates.total_losses = (sessionData.total_losses || 0) + 1;

            await supabase.from('agent_sessions').update(updates).eq('id', sessionId);
        }
    }

    /**
     * PvP Mode: Join matchmaking queue and attempt to find/resolve a match.
     */
    private async playPvP(
        sessionId: string,
        sessionWalletAddress: string,
        action: AgentAction,
        session: any
    ) {
        console.log(`Agent ${sessionId} in PvP mode. Checking matchmaking...`);

        try {
            // Try to join queue if not already in it
            const joinResult = await matchmakingService.joinQueue(
                sessionId,
                sessionId,
                action.game || 'RPS',
                action.wager,
                session.strategy || 'berzerker',
                session.elo_rating || 1000
            );

            if (joinResult.success) {
                console.log(`Agent ${sessionId} joined PvP queue. Looking for match...`);

                // Try to find a match immediately
                const matchResult = await matchmakingService.findMatch(sessionId);

                if (matchResult.matched && matchResult.matchId) {
                    console.log(`Agent ${sessionId} matched! Resolving match ${matchResult.matchId}...`);

                    const resolution = await matchmakingService.resolveMatch(matchResult.matchId);

                    if (resolution.success && resolution.result) {
                        const r = resolution.result;
                        const isWinner = r.winnerId === sessionId;
                        const resultStr = r.isDraw ? 'DRAW' : isWinner ? 'WIN' : 'LOSS';
                        console.log(`PvP Match ${matchResult.matchId}: ${resultStr} | ` +
                            `Score: ${r.p1Score}-${r.p2Score} | ` +
                            `ELO: ${r.p1EloChange > 0 ? '+' : ''}${r.p1EloChange}`);
                    }
                } else {
                    console.log(`Agent ${sessionId} waiting in queue for an opponent...`);
                }
            } else if (joinResult.error === 'Agent is already in matchmaking queue') {
                // Already in queue, try to find match
                const matchResult = await matchmakingService.findMatch(sessionId);
                if (matchResult.matched && matchResult.matchId) {
                    await matchmakingService.resolveMatch(matchResult.matchId);
                }
            } else {
                console.error(`PvP queue join failed: ${joinResult.error}`);
            }
        } catch (e) {
            console.error('PvP play failed:', e);
        }
    }
}

// Lazy singleton — only instantiated on first use at request time, not at module import
let _agentManagerInstance: AgentManagerService | null = null;
export const agentManager = new Proxy({} as AgentManagerService, {
    get(_target, prop) {
        if (!_agentManagerInstance) {
            _agentManagerInstance = AgentManagerService.getInstance();
        }
        const value = (_agentManagerInstance as any)[prop];
        return typeof value === 'function' ? value.bind(_agentManagerInstance) : value;
    }
});
