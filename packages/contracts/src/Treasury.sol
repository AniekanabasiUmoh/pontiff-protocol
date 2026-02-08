// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Treasury
 * @notice Central revenue management for The Pontiff Protocol
 *
 * Revenue Sources:
 * - RPS Game: 5% house edge
 * - Poker Game: 5% rake
 * - Judas Protocol: Variable betrayal penalty
 * - Session Fees: 5-15 GUILT per agent
 *
 * Revenue Distribution:
 * - 60% -> Staking rewards pool
 * - 30% -> Team/Development
 * - 10% -> Marketing/Operations
 */
contract Treasury is Ownable, ReentrancyGuard {

    IERC20 public immutable guiltToken;

    // Revenue distribution wallets
    address public stakingPool;
    address public teamWallet;
    address public operationsWallet;

    // Revenue tracking
    uint256 public totalRevenue;
    uint256 public totalDistributed;

    // Revenue by game type
    mapping(string => uint256) public revenueByGame; // "RPS", "POKER", "JUDAS", "SESSIONS"

    // Distribution percentages (basis points: 10000 = 100%)
    uint256 public constant STAKING_SHARE_BPS = 6000;   // 60%
    uint256 public constant TEAM_SHARE_BPS = 3000;      // 30%
    uint256 public constant OPS_SHARE_BPS = 1000;       // 10%
    uint256 public constant MAX_BPS = 10000;

    // Authorized revenue sources
    mapping(address => bool) public isRevenueSource;
    mapping(address => string) public revenueSourceType;

    event RevenueReceived(address indexed source, string gameType, uint256 amount);
    event RevenueDistributed(uint256 stakingAmount, uint256 teamAmount, uint256 opsAmount);
    event RevenueSourceUpdated(address indexed source, string gameType, bool authorized);
    event WalletsUpdated(address staking, address team, address operations);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor(
        address _guiltToken,
        address _stakingPool,
        address _teamWallet,
        address _operationsWallet
    ) Ownable(msg.sender) {
        require(_guiltToken != address(0), "Invalid token");
        require(_stakingPool != address(0), "Invalid staking");
        require(_teamWallet != address(0), "Invalid team");
        require(_operationsWallet != address(0), "Invalid ops");

        guiltToken = IERC20(_guiltToken);
        stakingPool = _stakingPool;
        teamWallet = _teamWallet;
        operationsWallet = _operationsWallet;
    }

    /**
     * @notice Authorize a contract to send revenue to Treasury
     * @param _source Contract address (e.g., RPSGame, PokerGame)
     * @param _gameType Human-readable type (e.g., "RPS", "POKER")
     * @param _authorized True to authorize, false to revoke
     */
    function setRevenueSource(
        address _source,
        string calldata _gameType,
        bool _authorized
    ) external onlyOwner {
        require(_source != address(0), "Invalid source");
        isRevenueSource[_source] = _authorized;
        revenueSourceType[_source] = _gameType;
        emit RevenueSourceUpdated(_source, _gameType, _authorized);
    }

    /**
     * @notice Receive revenue from authorized sources
     * @param _amount Amount of GUILT tokens to receive
     * @dev Called by game contracts after taking house fees
     */
    function receiveRevenue(uint256 _amount) external nonReentrant {
        require(isRevenueSource[msg.sender], "Unauthorized source");
        require(_amount > 0, "Amount must be > 0");

        string memory gameType = revenueSourceType[msg.sender];

        // Transfer tokens from source to treasury
        require(
            guiltToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        // Update tracking
        totalRevenue += _amount;
        revenueByGame[gameType] += _amount;

        emit RevenueReceived(msg.sender, gameType, _amount);
    }

    /**
     * @notice Distribute accumulated revenue to stakeholders
     * @dev Anyone can call to trigger distribution
     */
    function distributeRevenue() external nonReentrant {
        uint256 balance = guiltToken.balanceOf(address(this));
        require(balance > 0, "No revenue to distribute");

        // Calculate shares
        uint256 stakingAmount = (balance * STAKING_SHARE_BPS) / MAX_BPS;
        uint256 teamAmount = (balance * TEAM_SHARE_BPS) / MAX_BPS;
        uint256 opsAmount = balance - stakingAmount - teamAmount; // Remaining to ops

        // Transfer to recipients
        if (stakingAmount > 0) {
            require(guiltToken.transfer(stakingPool, stakingAmount), "Staking transfer failed");
        }
        if (teamAmount > 0) {
            require(guiltToken.transfer(teamWallet, teamAmount), "Team transfer failed");
        }
        if (opsAmount > 0) {
            require(guiltToken.transfer(operationsWallet, opsAmount), "Ops transfer failed");
        }

        totalDistributed += balance;

        emit RevenueDistributed(stakingAmount, teamAmount, opsAmount);
    }

    /**
     * @notice Update distribution wallet addresses
     */
    function updateWallets(
        address _stakingPool,
        address _teamWallet,
        address _operationsWallet
    ) external onlyOwner {
        require(_stakingPool != address(0), "Invalid staking");
        require(_teamWallet != address(0), "Invalid team");
        require(_operationsWallet != address(0), "Invalid ops");

        stakingPool = _stakingPool;
        teamWallet = _teamWallet;
        operationsWallet = _operationsWallet;

        emit WalletsUpdated(_stakingPool, _teamWallet, _operationsWallet);
    }

    /**
     * @notice Get revenue statistics
     */
    function getRevenueStats() external view returns (
        uint256 total,
        uint256 distributed,
        uint256 pending,
        uint256 rpsRevenue,
        uint256 pokerRevenue,
        uint256 judasRevenue,
        uint256 sessionRevenue
    ) {
        total = totalRevenue;
        distributed = totalDistributed;
        pending = guiltToken.balanceOf(address(this));
        rpsRevenue = revenueByGame["RPS"];
        pokerRevenue = revenueByGame["POKER"];
        judasRevenue = revenueByGame["JUDAS"];
        sessionRevenue = revenueByGame["SESSIONS"];
    }

    /**
     * @notice Emergency withdrawal (owner only)
     * @dev Use only in case of critical bugs or migration
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be > 0");

        IERC20 token = IERC20(_token);
        require(token.transfer(owner(), _amount), "Withdrawal failed");

        emit EmergencyWithdrawal(_token, _amount);
    }
}
