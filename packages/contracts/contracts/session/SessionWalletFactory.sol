// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SessionWallet.sol";

/**
 * @title SessionWalletFactory
 * @notice Deploys and manages SessionWallets.
 */
contract SessionWalletFactory is Ownable {
    using Clones for address;

    address public immutable sessionWalletImplementation;
    address public immutable guiltToken;
    address public pontiff; // The backend signer address

    // Registry
    mapping(address => address[]) public userSessions;
    mapping(address => bool) public isSessionWallet;

    event SessionCreated(address indexed user, address indexed sessionWallet, uint256 timestamp);
    event PontiffUpdated(address indexed newPontiff);

    constructor(address _guiltToken, address _pontiff) Ownable(msg.sender) {
        require(_guiltToken != address(0), "Invalid token");
        require(_pontiff != address(0), "Invalid pontiff");
        guiltToken = _guiltToken;
        pontiff = _pontiff;
        
        // Deploy implementation contract once
        sessionWalletImplementation = address(new SessionWallet());
    }

    function setPontiff(address _newPontiff) external onlyOwner {
        require(_newPontiff != address(0), "Invalid address");
        pontiff = _newPontiff;
        emit PontiffUpdated(_newPontiff);
    }

    /**
     * @notice Create a new Session Wallet for the caller.
     * @return wallet The address of the new SessionWallet.
     */
    function createSession() external returns (address wallet) {
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

        emit SessionCreated(msg.sender, wallet, block.timestamp);
    }

    /**
     * @notice Helpers to get user sessions
     */
    function getUserSessions(address user) external view returns (address[] memory) {
        return userSessions[user];
    }
}
