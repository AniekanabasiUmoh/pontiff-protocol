// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SessionWallet.sol";

/**
 * @title SessionWalletFactory
 * @notice Deploys and manages SessionWallets with strategy-based session fees.
 *
 * Module 6: Agent Strategies (The Champions)
 * - Berzerker: 10 GUILT fee (high risk)
 * - Merchant: 15 GUILT fee (medium risk)
 * - Disciple: 5 GUILT fee (low risk)
 */
contract SessionWalletFactory is Ownable {
    using Clones for address;

    address public immutable sessionWalletImplementation;
    address public immutable guiltToken;
    address public pontiff; // The backend signer address
    address public treasury; // Treasury for collecting session fees

    // Strategy fees (in wei, 1e18 = 1 GUILT)
    uint256 public constant BERZERKER_FEE = 10 ether; // 10 GUILT
    uint256 public constant MERCHANT_FEE = 15 ether;  // 15 GUILT
    uint256 public constant DISCIPLE_FEE = 5 ether;   // 5 GUILT

    // Strategy enum
    enum Strategy { BERZERKER, MERCHANT, DISCIPLE }

    // Registry
    mapping(address => address[]) public userSessions;
    mapping(address => bool) public isSessionWallet;
    mapping(address => Strategy) public sessionStrategy; // Track strategy per session

    event SessionCreated(address indexed user, address indexed sessionWallet, Strategy strategy, uint256 fee, uint256 timestamp);
    event PontiffUpdated(address indexed newPontiff);
    event TreasuryUpdated(address indexed newTreasury);
    event FeeCollected(address indexed user, Strategy strategy, uint256 amount);

    constructor(address _guiltToken, address _pontiff) Ownable(msg.sender) {
        require(_guiltToken != address(0), "Invalid token");
        require(_pontiff != address(0), "Invalid pontiff");
        guiltToken = _guiltToken;
        pontiff = _pontiff;
        treasury = msg.sender; // Default treasury to deployer

        // Deploy implementation contract once
        sessionWalletImplementation = address(new SessionWallet());
    }

    function setPontiff(address _newPontiff) external onlyOwner {
        require(_newPontiff != address(0), "Invalid address");
        pontiff = _newPontiff;
        emit PontiffUpdated(_newPontiff);
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /**
     * @notice Get the session fee for a given strategy
     */
    function getStrategyFee(Strategy _strategy) public pure returns (uint256) {
        if (_strategy == Strategy.BERZERKER) return BERZERKER_FEE;
        if (_strategy == Strategy.MERCHANT) return MERCHANT_FEE;
        if (_strategy == Strategy.DISCIPLE) return DISCIPLE_FEE;
        return 0;
    }

    /**
     * @notice Create a new Session Wallet for the caller with a strategy-based fee.
     * @param _strategy The agent strategy (0=Berzerker, 1=Merchant, 2=Disciple)
     * @return wallet The address of the new SessionWallet.
     *
     * User must have approved this contract to spend GUILT tokens for the session fee.
     */
    function createSession(Strategy _strategy) external returns (address wallet) {
        uint256 fee = getStrategyFee(_strategy);

        // Transfer session fee from user to treasury
        require(
            IERC20(guiltToken).transferFrom(msg.sender, treasury, fee),
            "Fee transfer failed"
        );

        emit FeeCollected(msg.sender, _strategy, fee);

        // Deploy minimal proxy
        wallet = sessionWalletImplementation.clone();

        // Initialize the clone
        SessionWallet(payable(wallet)).initialize(
            msg.sender, // Owner is the user
            pontiff,    // Pontiff is the backend
            guiltToken
        );

        // Record it
        userSessions[msg.sender].push(wallet);
        isSessionWallet[wallet] = true;
        sessionStrategy[wallet] = _strategy;

        emit SessionCreated(msg.sender, wallet, _strategy, fee, block.timestamp);
    }

    /**
     * @notice Legacy function for backward compatibility (defaults to Berzerker)
     * @dev Deprecated - use createSession(Strategy) instead
     */
    function createSession() external returns (address wallet) {
        return this.createSession(Strategy.BERZERKER);
    }

    /**
     * @notice Helpers to get user sessions
     */
    function getUserSessions(address user) external view returns (address[] memory) {
        return userSessions[user];
    }

    /**
     * @notice Get strategy for a session wallet
     */
    function getSessionStrategy(address sessionWallet) external view returns (Strategy) {
        return sessionStrategy[sessionWallet];
    }

    /**
     * @notice Get strategy name as string for a session wallet
     */
    function getSessionStrategyName(address sessionWallet) external view returns (string memory) {
        Strategy strat = sessionStrategy[sessionWallet];
        if (strat == Strategy.BERZERKER) return "berzerker";
        if (strat == Strategy.MERCHANT) return "merchant";
        if (strat == Strategy.DISCIPLE) return "disciple";
        return "unknown";
    }
}
