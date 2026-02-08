// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Indulgence
 * @dev Soulbound Token (SBT) representing Absolution.
 *
 * MECHANICS:
 * - Soulbound: Transfers revert.
 * - Minting: `absolve(sinId, severity)` - Tiered Pricing.
 * - Cost: Based on severity (50-500 $GUILT) -> Sent to Staking Cathedral (Yield).
 * - Revocation: Owner can revoke absolution (excommunication).
 * - Re-Entry: Users can get multiple absolutions.
 */
contract Indulgence is ERC721, Ownable, ReentrancyGuard {
    IERC20 public immutable paymentToken;
    address public immutable cathedral; // Staking Contract

    // Tiered pricing based on sin severity
    uint256 public constant MINOR_COST = 50 * 1e18;        // Minor sins: 50 GUILT
    uint256 public constant MORTAL_COST = 100 * 1e18;      // Mortal sins: 100 GUILT
    uint256 public constant CARDINAL_COST = 250 * 1e18;    // Cardinal sins: 250 GUILT
    uint256 public constant UNFORGIVABLE_COST = 500 * 1e18; // Unforgivable: 500 GUILT

    uint256 public nextTokenId;

    // Sin severity enum
    enum SinSeverity { MINOR, MORTAL, CARDINAL, UNFORGIVABLE }

    // Mapping from TokenID -> SinID (What did you do?)
    mapping(uint256 => uint256) public sinIds;

    // Mapping from TokenID -> Sin Severity
    mapping(uint256 => SinSeverity) public sinSeverity;

    // Mapping from TokenID -> Revocation status
    mapping(uint256 => bool) public isRevoked;

    // Track absolutions per address for re-entry
    mapping(address => uint256) public absolutionCount;

    event Absolution(address indexed sinner, uint256 indexed sinId, uint256 tokenId, SinSeverity severity, uint256 cost);
    event Revocation(address indexed sinner, uint256 indexed tokenId, string reason);

    constructor(address _paymentToken, address _cathedral, address _initialOwner) 
        ERC721("Pontiff Indulgence", "SINE") 
        Ownable(_initialOwner) 
    {
        paymentToken = IERC20(_paymentToken);
        cathedral = _cathedral;
    }

    /**
     * @dev Buy forgiveness with tiered pricing based on sin severity.
     * @param sinId The ID of the sin being absolved
     * @param severity The severity level of the sin (0=Minor, 1=Mortal, 2=Cardinal, 3=Unforgivable)
     */
    function absolve(uint256 sinId, SinSeverity severity) external nonReentrant {
        // 1. Calculate cost based on severity
        uint256 cost = getAbsolutionCost(severity);

        // 2. Take Payment
        bool success = paymentToken.transferFrom(msg.sender, cathedral, cost);
        require(success, "Payment failed");

        // 3. Mint
        nextTokenId++;
        _safeMint(msg.sender, nextTokenId);

        // 4. Record Sin and Severity
        sinIds[nextTokenId] = sinId;
        sinSeverity[nextTokenId] = severity;

        // 5. Track absolution count for re-entry
        absolutionCount[msg.sender]++;

        emit Absolution(msg.sender, sinId, nextTokenId, severity, cost);
    }

    /**
     * @dev Get the cost of absolution based on sin severity
     */
    function getAbsolutionCost(SinSeverity severity) public pure returns (uint256) {
        if (severity == SinSeverity.MINOR) return MINOR_COST;
        if (severity == SinSeverity.MORTAL) return MORTAL_COST;
        if (severity == SinSeverity.CARDINAL) return CARDINAL_COST;
        return UNFORGIVABLE_COST;
    }

    /**
     * @dev Revoke absolution (excommunication) - Only owner
     * @param tokenId The token ID to revoke
     * @param reason The reason for revocation
     */
    function revoke(uint256 tokenId, string calldata reason) external onlyOwner {
        _requireOwned(tokenId);
        require(!isRevoked[tokenId], "Already revoked");

        address sinner = ownerOf(tokenId);
        isRevoked[tokenId] = true;

        emit Revocation(sinner, tokenId, reason);
    }

    /**
     * @dev Check if a token is still valid (not revoked)
     */
    function isValid(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        return !isRevoked[tokenId];
    }

    /**
     * @dev Soulbound Logic: Block transfers
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow Minting (from == 0) and Burning (to == 0) if desired.
        // Block transfers between real users.
        if (from != address(0) && to != address(0)) {
            revert("Your Soul is Bound to the Pontiff");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Returns dynamic metadata URL for the token
     * Backend will generate metadata with severity and revocation status
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("https://api.pontiff.xyz/metadata/indulgence/", Strings.toString(tokenId)));
    }

    /**
     * @dev Get sin information for a token
     */
    function getSinInfo(uint256 tokenId) external view returns (
        uint256 sinId,
        SinSeverity severity,
        bool revoked,
        address owner
    ) {
        _requireOwned(tokenId);
        return (
            sinIds[tokenId],
            sinSeverity[tokenId],
            isRevoked[tokenId],
            ownerOf(tokenId)
        );
    }
}
