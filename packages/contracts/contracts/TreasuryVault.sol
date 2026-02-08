// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * Module 13: Treasury Vault
 *
 * Central treasury for all Pontiff Protocol revenue
 * - Receives house fees from all games
 * - Distributes revenue: 60% staking, 30% team, 10% ops
 * - Tracks total protocol revenue
 * - Emergency controls for owner
 */
contract TreasuryVault is Ownable, ReentrancyGuard {
    IERC20 public guiltToken;

    address public stakingPool;
    address public teamWallet;
    address public opsWallet;

    // Revenue distribution percentages (basis points)
    uint256 public constant STAKING_BPS = 6000;   // 60%
    uint256 public constant TEAM_BPS = 3000;      // 30%
    uint256 public constant OPS_BPS = 1000;       // 10%
    uint256 public constant MAX_BPS = 10000;      // 100%

    // Revenue tracking
    uint256 public totalRevenueReceived;
    uint256 public totalRevenueDistributed;
    uint256 public pendingDistribution;

    // Per-wallet tracking
    mapping(address => uint256) public stakingDistributed;
    mapping(address => uint256) public teamDistributed;
    mapping(address => uint256) public opsDistributed;

    event RevenueReceived(address indexed source, uint256 amount);
    event RevenueDistributed(uint256 stakingAmount, uint256 teamAmount, uint256 opsAmount);
    event WalletUpdated(string walletType, address indexed oldWallet, address indexed newWallet);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    constructor(
        address _guiltToken,
        address _stakingPool,
        address _teamWallet,
        address _opsWallet
    ) Ownable(msg.sender) {
        require(_guiltToken != address(0), "Invalid token");
        require(_stakingPool != address(0), "Invalid staking pool");
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_opsWallet != address(0), "Invalid ops wallet");

        guiltToken = IERC20(_guiltToken);
        stakingPool = _stakingPool;
        teamWallet = _teamWallet;
        opsWallet = _opsWallet;
    }

    /**
     * Receive revenue from game contracts
     */
    function receiveRevenue(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(
            guiltToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        totalRevenueReceived += _amount;
        pendingDistribution += _amount;

        emit RevenueReceived(msg.sender, _amount);
    }

    /**
     * Distribute pending revenue according to allocation
     */
    function distributeRevenue() external nonReentrant {
        require(pendingDistribution > 0, "No revenue to distribute");

        uint256 amount = pendingDistribution;

        // Calculate distribution amounts
        uint256 stakingAmount = (amount * STAKING_BPS) / MAX_BPS;
        uint256 teamAmount = (amount * TEAM_BPS) / MAX_BPS;
        uint256 opsAmount = (amount * OPS_BPS) / MAX_BPS;

        // Handle rounding dust
        uint256 dust = amount - (stakingAmount + teamAmount + opsAmount);
        stakingAmount += dust; // Add dust to staking pool

        // Transfer to recipients
        require(guiltToken.transfer(stakingPool, stakingAmount), "Staking transfer failed");
        require(guiltToken.transfer(teamWallet, teamAmount), "Team transfer failed");
        require(guiltToken.transfer(opsWallet, opsAmount), "Ops transfer failed");

        // Update tracking
        stakingDistributed[stakingPool] += stakingAmount;
        teamDistributed[teamWallet] += teamAmount;
        opsDistributed[opsWallet] += opsAmount;

        totalRevenueDistributed += amount;
        pendingDistribution = 0;

        emit RevenueDistributed(stakingAmount, teamAmount, opsAmount);
    }

    /**
     * Update staking pool address (owner only)
     */
    function updateStakingPool(address _newStakingPool) external onlyOwner {
        require(_newStakingPool != address(0), "Invalid address");
        address oldPool = stakingPool;
        stakingPool = _newStakingPool;
        emit WalletUpdated("staking", oldPool, _newStakingPool);
    }

    /**
     * Update team wallet (owner only)
     */
    function updateTeamWallet(address _newTeamWallet) external onlyOwner {
        require(_newTeamWallet != address(0), "Invalid address");
        address oldWallet = teamWallet;
        teamWallet = _newTeamWallet;
        emit WalletUpdated("team", oldWallet, _newTeamWallet);
    }

    /**
     * Update ops wallet (owner only)
     */
    function updateOpsWallet(address _newOpsWallet) external onlyOwner {
        require(_newOpsWallet != address(0), "Invalid address");
        address oldWallet = opsWallet;
        opsWallet = _newOpsWallet;
        emit WalletUpdated("ops", oldWallet, _newOpsWallet);
    }

    /**
     * Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        uint256 balance = guiltToken.balanceOf(address(this));
        require(_amount <= balance, "Insufficient balance");

        require(guiltToken.transfer(_to, _amount), "Withdrawal failed");
        emit EmergencyWithdrawal(_to, _amount);
    }

    /**
     * Get treasury statistics
     */
    function getTreasuryStats() external view returns (
        uint256 currentBalance,
        uint256 totalRevenue,
        uint256 totalDistributed,
        uint256 pending
    ) {
        return (
            guiltToken.balanceOf(address(this)),
            totalRevenueReceived,
            totalRevenueDistributed,
            pendingDistribution
        );
    }

    /**
     * Get distribution breakdown
     */
    function getDistributionBreakdown() external view returns (
        uint256 stakingTotal,
        uint256 teamTotal,
        uint256 opsTotal
    ) {
        return (
            stakingDistributed[stakingPool],
            teamDistributed[teamWallet],
            opsDistributed[opsWallet]
        );
    }
}
