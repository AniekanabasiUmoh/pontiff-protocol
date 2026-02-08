// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaticanEntry
 * @notice Gatekeeper contract for The Pontiff's Vatican World.
 * Agents must pay an entry fee in MON tokens to enter and interact with the ecosystem.
 */
contract VaticanEntry is Ownable {
    IERC20 public immutable monToken;
    uint256 public entryFee;
    
    mapping(address => bool) public hasEntered;
    mapping(address => uint256) public entryTimestamp;
    
    event AgentEntered(address indexed agent, uint256 timestamp);
    event EntryFeeUpdated(uint256 newFee);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor(address _monToken, uint256 _entryFee) Ownable(msg.sender) {
        require(_monToken != address(0), "Invalid token address");
        monToken = IERC20(_monToken);
        entryFee = _entryFee;
    }

    uint256 public totalEntrants;

    /**
     * @notice Pay the entry fee to gain access to the Vatican.
     * @dev Requires approval of MON tokens to this contract.
     */
    function enterVatican() external {
        require(!hasEntered[msg.sender], "Already entered");
        
        bool success = monToken.transferFrom(msg.sender, address(this), entryFee);
        require(success, "Payment failed");

        hasEntered[msg.sender] = true;
        entryTimestamp[msg.sender] = block.timestamp;
        totalEntrants++;

        emit AgentEntered(msg.sender, block.timestamp);
    }

    /**
     * @notice Check if an agent has entered the Vatican.
     */
    function isInVatican(address agent) external view returns (bool) {
        return hasEntered[agent];
    }
    
    function getEntryTimestamp(address agent) external view returns (uint256) {
        return entryTimestamp[agent];
    }

    function getTotalEntrants() external view returns (uint256) {
        return totalEntrants;
    }

    // --- Admin Functions ---

    function setEntryFee(uint256 _newFee) external onlyOwner {
        entryFee = _newFee;
        emit EntryFeeUpdated(_newFee);
    }

    function withdrawMON(address to) external onlyOwner {
        uint256 balance = monToken.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        require(monToken.transfer(to, balance), "Transfer failed");
        emit FundsWithdrawn(to, balance);
    }
}
