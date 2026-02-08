// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title JudasProtocol
 * @dev The Game Theory Layer. Stakers wager their $sGUILT on loyalty vs betrayal.
 * 
 * MECHANICS:
 * - Collateral: $sGUILT (Staked Guilt from Phase 7)
 * - Epochs: 24h cycles.
 * - Actions:
 *   1. Stake (Enter Arena as Loyalist).
 *   2. Signal Betrayal (Lock stake until Epoch ends).
 *   3. Withdraw (Exit Arena - Paying Sin Tax if applicable).
 * 
 * RESOLUTION (Zero-Sum PVP):
 * - Failed Coup (<20%): Loyalists take 100% of Betrayers' stake.
 * - Partial Coup (20-40%): Betrayers steal 20% of Loyalist stake.
 * - Full Coup (>40%): Betrayers steal 50% of Loyalist stake.
 */
contract JudasProtocol is Ownable, ReentrancyGuard {
    IERC20 public immutable sGuilt;
    address public immutable treasury; // Treasury for tax collection

    // Config
    uint256 public constant EPOCH_DURATION = 1 days;
    uint256 public constant SIN_TAX_BPS = 2000; // 20%
    uint256 public constant MAX_BPS = 10000;

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalLoyal;
        uint256 totalBetrayed;
        bool resolved;
        uint256 loyalistMultiplier; 
        uint256 betrayerMultiplier; 
    }

    uint256 public currentEpochId;
    mapping(uint256 => Epoch) public epochs;

    struct UserInfo {
        uint256 stakedAmount;
        uint256 lastEpochInteraction;
        bool isBetrayer; 
    }
    mapping(address => UserInfo) public userInfo;

    event EpochStarted(uint256 indexed id, uint256 endTime);
    event BetrayalSignaled(address indexed user, uint256 amount);
    event EpochResolved(uint256 indexed id, uint256 betrayalPct, string outcome);
    // Tournament Config
    uint256 public constant ROUNDS_PER_TOURNAMENT = 5;
    uint256 public currentTournamentId = 1;
    uint256 public currentRound = 0; // Will initialize to 1 on first start

    struct Reputation {
        uint32 loyalCount;
        uint32 betrayalCount;
    }
    mapping(address => Reputation) public reputation;

    event TournamentStarted(uint256 indexed id);
    event RoundStarted(uint256 indexed tournamentId, uint256 roundId, uint256 endTime);

    constructor(address _sGuilt, address _initialOwner, address _treasury) Ownable(_initialOwner) {
        require(_treasury != address(0), "Invalid treasury");
        sGuilt = IERC20(_sGuilt);
        treasury = _treasury;
        _startRound(); 
    }

    function _startEpoch() internal {
        // Deprecated alias for _startRound to minimize diffs if called elsewhere, but we should use _startRound
        _startRound();
    }

    function _startRound() internal {
        // Increment round
        currentRound++;
        
        // Check for Tournament Reset
        if (currentRound > ROUNDS_PER_TOURNAMENT) {
            currentTournamentId++;
            currentRound = 1;
            emit TournamentStarted(currentTournamentId);
        }

        currentEpochId++; // We keep epochId as a global counter for unique IDs
        
        epochs[currentEpochId] = Epoch({
            startTime: block.timestamp,
            endTime: block.timestamp + EPOCH_DURATION,
            totalLoyal: 0,
            totalBetrayed: 0,
            resolved: false,
            loyalistMultiplier: 1e18, // 1.0x
            betrayerMultiplier: 1e18  // 1.0x
        });
        
        emit EpochStarted(currentEpochId, block.timestamp + EPOCH_DURATION);
        emit RoundStarted(currentTournamentId, currentRound, block.timestamp + EPOCH_DURATION);
    }

    // =============================================================
    // ACTIONS
    // =============================================================

    /**
     * @dev Deposit sGUILT to play. Default stance: Loyalist.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        _updateEpochState(); // Ensure we are in valid epoch

        sGuilt.transferFrom(msg.sender, address(this), amount);

        UserInfo storage user = userInfo[msg.sender];
        _claimPendingRewards(msg.sender); // Settle previous epoch results if any

        user.stakedAmount += amount;
        user.isBetrayer = false; // Reset stance on new deposit? Or keep? Let's say default is Loyal.
        
        epochs[currentEpochId].totalLoyal += amount;
    }

    /**
     * @dev Switch sides to Betrayer. LOCKS funds until resolution.
     */
    function signalBetrayal() external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.stakedAmount > 0, "No stake");
        require(!user.isBetrayer, "Already betrayed");
        
        _updateEpochState();
        require(!epochs[currentEpochId].resolved, "Epoch resolved");

        // Move stack from Loyal -> Betrayed
        epochs[currentEpochId].totalLoyal -= user.stakedAmount;
        epochs[currentEpochId].totalBetrayed += user.stakedAmount;
        
        user.isBetrayer = true;
        emit BetrayalSignaled(msg.sender, user.stakedAmount);
    }

    /**
     * @dev Resolve the Epoch outcomes. Callable by anyone after time ends.
     */
    function resolveEpoch() external nonReentrant {
        Epoch storage epoch = epochs[currentEpochId];
        require(block.timestamp >= epoch.endTime, "Epoch ongoing");
        require(!epoch.resolved, "Already resolved");

        uint256 totalPool = epoch.totalLoyal + epoch.totalBetrayed;
        if (totalPool == 0) {
            epoch.resolved = true;
            _startRound();
            return;
        }

        uint256 betrayalPct = (epoch.totalBetrayed * 100) / totalPool;
        string memory outcome;

        // Multipliers default to 1e18 (no change)
        // If one side wins, they take from the other side.
        
        if (betrayalPct < 20) {
            // FAILED COUP: Loyalists take 100% of Betrayers
            outcome = "FAILED_COUP";
            // Betrayers get 0. Loyalists get (TotalPool / TotalLoyal)
            if (epoch.totalLoyal > 0) {
                epoch.loyalistMultiplier = (totalPool * 1e18) / epoch.totalLoyal;
            }
            epoch.betrayerMultiplier = 0;
            
        } else if (betrayalPct < 40) {
            // PARTIAL COUP: Betrayers steal 20% of Loyalist stack
            outcome = "PARTIAL_COUP";
            // Loyalists lose 20% -> 0.8x
            // Betrayers gain the lost amount
            uint256 loot = (epoch.totalLoyal * 20) / 100;
            uint256 loyalistRemaining = epoch.totalLoyal - loot;
            
            epoch.loyalistMultiplier = (loyalistRemaining * 1e18) / epoch.totalLoyal; // ~0.8e18
            epoch.betrayerMultiplier = ((epoch.totalBetrayed + loot) * 1e18) / epoch.totalBetrayed;
            
        } else {
            // FULL COUP: Betrayers steal 50% of Loyalist stack
            outcome = "FULL_COUP";
            uint256 loot = (epoch.totalLoyal * 50) / 100;
            uint256 loyalistRemaining = epoch.totalLoyal - loot;
            
            epoch.loyalistMultiplier = (loyalistRemaining * 1e18) / epoch.totalLoyal; // ~0.5e18
            epoch.betrayerMultiplier = ((epoch.totalBetrayed + loot) * 1e18) / epoch.totalBetrayed;
        }

        epoch.resolved = true;
        emit EpochResolved(currentEpochId, betrayalPct, outcome);
        
        _startRound(); // Next round begins
    }

    /**
     * @dev Internal helper to process a user's result from their last epoch
     */
    function _claimPendingRewards(address userAddr) internal {
        UserInfo storage user = userInfo[userAddr];
        
        if (user.lastEpochInteraction < currentEpochId && user.stakedAmount > 0) {
            Epoch storage prevEpoch = epochs[currentEpochId - 1]; // Use previous resolved epoch
            // This logic assumes continuous participation. 
            // If skipped multiple epochs, this simple logic breaks.
            // MVP Fix: Check the SPECIFIC epoch they were last in.
            
            if (prevEpoch.resolved) {
                 uint256 mult = user.isBetrayer ? prevEpoch.betrayerMultiplier : prevEpoch.loyalistMultiplier;
                 user.stakedAmount = (user.stakedAmount * mult) / 1e18;

                 // Update Reputation
                 if (user.isBetrayer) {
                     reputation[userAddr].betrayalCount++;
                 } else {
                     reputation[userAddr].loyalCount++;
                 }
                 
                 // Reset betrayal stance for next round (Default to Loyal)
                 user.isBetrayer = false; 
            }
        }
        
        user.lastEpochInteraction = currentEpochId;
    }

    /**
     * @dev Withdraw with Sin Tax (Phase 8.4)
     */
    function withdraw(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        _claimPendingRewards(msg.sender); // Realize PnL first
        
        require(amount <= user.stakedAmount, "Insufficient balance");
        require(!user.isBetrayer, "Betrayers locked until resolution"); // Can't withdraw mid-coup

        user.stakedAmount -= amount;
        
        // Remove from current epoch pool (Loyalists)
        if (epochs[currentEpochId].totalLoyal >= amount) {
             epochs[currentEpochId].totalLoyal -= amount;
        }

        // Apply Sin Tax (20%)
        uint256 tax = (amount * SIN_TAX_BPS) / MAX_BPS;
        uint256 payout = amount - tax;

        sGuilt.transfer(msg.sender, payout);
        // Send tax to treasury
        if (tax > 0) {
            sGuilt.transfer(treasury, tax);
        }
    }

    function _updateEpochState() internal view {
        if (block.timestamp >= epochs[currentEpochId].endTime && !epochs[currentEpochId].resolved) {
            revert("Current Epoch finished. Call resolveEpoch()!");
        }
    }

    // =============================================================
    // VIEW FUNCTIONS
    // =============================================================

    /**
     * @dev Get current game state for UI/API integration
     */
    function getGameState() external view returns (
        uint256 epochId,
        uint256 endTime,
        uint256 totalLoyal,
        uint256 totalBetrayed,
        bool resolved,
        uint256 betrayalPercentage
    ) {
        Epoch storage epoch = epochs[currentEpochId];
        epochId = currentEpochId;
        endTime = epoch.endTime;
        totalLoyal = epoch.totalLoyal;
        totalBetrayed = epoch.totalBetrayed;
        resolved = epoch.resolved;

        uint256 totalPool = totalLoyal + totalBetrayed;
        betrayalPercentage = totalPool > 0 ? (totalBetrayed * 100) / totalPool : 0;
    }

    /**
     * @dev Get user's current position
     */
    function getUserPosition(address user) external view returns (
        uint256 stakedAmount,
        bool isBetrayer,
        uint256 lastEpoch
    ) {
        UserInfo storage info = userInfo[user];
        return (info.stakedAmount, info.isBetrayer, info.lastEpochInteraction);
    }
    
    function getTournamentState() external view returns (
        uint256 tournamentId,
        uint256 round,
        uint256 maxRounds
    ) {
        return (currentTournamentId, currentRound, ROUNDS_PER_TOURNAMENT);
    }

    function getReputation(address user) external view returns (uint32 loyal, uint32 betrayed) {
        Reputation memory rep = reputation[user];
        return (rep.loyalCount, rep.betrayalCount);
    }
}
