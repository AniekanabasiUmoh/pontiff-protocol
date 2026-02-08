// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// Interface for Pontiff Game Contracts to ensure safety
interface IPontiffGame {
    function play(uint256 wager) external;
}

/**
 * @title SessionWallet
 * @notice A temporary wallet holding user funds, controlled by the Pontiff backend.
 * @dev Deployed as a minimal proxy by SessionWalletFactory.
 */
contract SessionWallet is Initializable, Ownable {
    
    address public pontiff;      // The backend agent allowed to play games
    IERC20 public guiltToken;    // The token used for gambling
    
    event GameExecuted(address indexed target, bytes data, bool success);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the clone.
     * @param _owner The user who owns the funds.
     * @param _pontiff The backend address allowed to execute games.
     * @param _guiltToken The address of the GUILT token.
     */
    function initialize(address _owner, address _pontiff, address _guiltToken) external initializer {
        _transferOwnership(_owner);
        pontiff = _pontiff;
        guiltToken = IERC20(_guiltToken);
    }

    /**
     * @notice Modifier to ensure only Pontiff can execute games.
     */
    modifier onlyPontiff() {
        require(msg.sender == pontiff, "SessionWallet: Only Pontiff can execute");
        _;
    }

    /**
     * @notice Execute a game transaction.
     * @dev Only callable by Pontiff. Restricts calls to approved game contracts? 
     *      For MVP, we allow generic calls but only if they are successful.
     *      In production, we should whitelist targets.
     * @param target The game contract address.
     * @param data The transaction data (function selector + args).
     */
    function executeGame(address target, bytes calldata data) external onlyPontiff {
        // Approve the target contract to spend tokens if needed?
        // Usually games allow `transferFrom`.
        // If the game uses `transferFrom(msg.sender, ...)`, then THIS wallet is `msg.sender`.
        // So we need to approve the target first.
        
        // Safety: Reset approval to 0 first (some tokens require it), then set max?
        // Or just approve enough for this tx?
        // Let's assume the game pulls the wager.
        
        // For simplicity in MVP: We blindly approve target. 
        // WARNING: This assumes 'target' is a trusted Pontiff game contract.
        // Backend key security is paramount here.
        guiltToken.approve(target, type(uint256).max);

        (bool success, ) = target.call(data);
        require(success, "SessionWallet: Game execution failed");

        emit GameExecuted(target, data, success);
    }

    /**
     * @notice Withdraws all GUILT tokens back to the owner.
     * @dev Can be called by Owner anytime (rage quit) or Pontiff (session expiry).
     */
    function withdraw() external {
        require(msg.sender == owner() || msg.sender == pontiff, "SessionWallet: Unauthorized");
        
        uint256 balance = guiltToken.balanceOf(address(this));
        require(balance > 0, "SessionWallet: No funds to withdraw");
        
        guiltToken.transfer(owner(), balance);
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @notice Escape hatch for ETH (shouldn't be here, but just in case)
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Allow receiving ETH
    receive() external payable {}
}
