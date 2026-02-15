// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PontiffTreasury
 * @notice The central user vault for the Pontiff Casino.
 * @dev Users deposit GUILT to play off-chain games. Withdrawals require backend signature.
 *
 * SECURITY:
 * - Nonce per user prevents replay attacks
 * - Deadline prevents stale signatures
 * - Contract address in hash prevents cross-contract replay
 * - Pausable for emergency stops
 * - Deposit cap prevents whale concentration
 * - Min withdrawal prevents dust attacks
 * - Cannot drain GUILT via recoverToken()
 */
contract PontiffTreasury is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable guiltToken;
    address public signer; // Backend wallet that signs withdrawal permits

    // Safety controls
    bool public paused;
    uint256 public maxDepositPerUser;    // Max GUILT a single user can deposit (0 = unlimited)
    uint256 public minWithdrawalAmount;  // Minimum withdrawal to prevent dust

    // State tracking
    mapping(address => uint256) public userNonce;
    mapping(address => uint256) public userTotalDeposited;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 newTotal, uint256 timestamp);
    event Withdraw(address indexed user, uint256 amount, uint256 nonce, uint256 timestamp);
    event SignerUpdated(address oldSigner, address newSigner);
    event Paused(address by);
    event Unpaused(address by);
    event DepositCapUpdated(uint256 oldCap, uint256 newCap);
    event MinWithdrawalUpdated(uint256 oldMin, uint256 newMin);

    modifier whenNotPaused() {
        require(!paused, "Treasury is paused");
        _;
    }

    constructor(address _guiltToken, address _signer) Ownable(msg.sender) {
        require(_guiltToken != address(0), "Invalid token");
        require(_signer != address(0), "Invalid signer");
        guiltToken = IERC20(_guiltToken);
        signer = _signer;
        maxDepositPerUser = 0; // Unlimited by default
        minWithdrawalAmount = 1e18; // Minimum 1 GUILT
    }

    // =============================================================
    // USER ACTIONS
    // =============================================================

    /**
     * @notice Deposit GUILT tokens into the casino vault.
     * @dev User must approve this contract first.
     * @param amount The amount of GUILT to deposit (in wei)
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Zero deposit");

        // Enforce deposit cap if set
        if (maxDepositPerUser > 0) {
            require(
                userTotalDeposited[msg.sender] + amount <= maxDepositPerUser,
                "Exceeds deposit cap"
            );
        }

        bool success = guiltToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        userTotalDeposited[msg.sender] += amount;

        emit Deposit(msg.sender, amount, userTotalDeposited[msg.sender], block.timestamp);
    }

    /**
     * @notice Withdraw GUILT tokens from the casino vault.
     * @dev Requires a signature from the backend (Pontiff signer).
     * @param amount The amount to withdraw
     * @param deadline The timestamp when this signature expires
     * @param signature The backend's signature authorizing this withdrawal
     */
    function withdraw(uint256 amount, uint256 deadline, bytes calldata signature) external nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "Signature expired");
        require(amount >= minWithdrawalAmount, "Below minimum withdrawal");
        require(guiltToken.balanceOf(address(this)) >= amount, "Insufficient treasury balance");

        // Current nonce for replay protection
        uint256 nonce = userNonce[msg.sender];

        // Reconstruct the signed message
        bytes32 hash = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            nonce,
            deadline,
            address(this) // Prevent cross-contract replay
        ));

        // Verify backend signature
        address recoveredSigner = hash.toEthSignedMessageHash().recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        // Increment nonce BEFORE transfer (CEI pattern)
        userNonce[msg.sender]++;

        // Transfer GUILT to user
        bool success = guiltToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, amount, nonce, block.timestamp);
    }

    // =============================================================
    // ADMIN FUNCTIONS
    // =============================================================

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function setSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid address");
        emit SignerUpdated(signer, _newSigner);
        signer = _newSigner;
    }

    function setMaxDeposit(uint256 _cap) external onlyOwner {
        emit DepositCapUpdated(maxDepositPerUser, _cap);
        maxDepositPerUser = _cap;
    }

    function setMinWithdrawal(uint256 _min) external onlyOwner {
        emit MinWithdrawalUpdated(minWithdrawalAmount, _min);
        minWithdrawalAmount = _min;
    }

    /**
     * @notice Emergency: recover accidental tokens (NOT GUILT).
     */
    function recoverToken(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(guiltToken), "Cannot drain user funds");
        IERC20(_token).transfer(owner(), _amount);
    }

    // =============================================================
    // VIEW FUNCTIONS
    // =============================================================

    function getVaultBalance() external view returns (uint256) {
        return guiltToken.balanceOf(address(this));
    }

    function getUserNonce(address _user) external view returns (uint256) {
        return userNonce[_user];
    }

    function getUserTotalDeposited(address _user) external view returns (uint256) {
        return userTotalDeposited[_user];
    }
}
