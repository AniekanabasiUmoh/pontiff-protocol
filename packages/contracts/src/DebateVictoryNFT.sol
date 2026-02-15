// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DebateVictoryNFT
 * @dev ERC-721 NFT minted to winners of Pontiff debates
 * @notice Each debate winner receives a unique commemorative NFT
 */
contract DebateVictoryNFT is ERC721, ERC721URIStorage, Ownable {
    // Simple counter (OpenZeppelin v5 removed Counters library)
    uint256 private _nextTokenId;
    
    // Mapping from debate ID to token ID (prevents double minting)
    mapping(bytes32 => uint256) public debateToToken;
    
    // Mapping from token ID to debate metadata
    mapping(uint256 => DebateMetadata) public tokenMetadata;
    
    struct DebateMetadata {
        bytes32 debateId;
        address winner;
        uint256 mintedAt;
        string topic;
    }
    
    // Events
    event VictoryNFTMinted(
        uint256 indexed tokenId,
        bytes32 indexed debateId,
        address indexed winner,
        string topic
    );
    
    // Authorized minters (backend API)
    mapping(address => bool) public authorizedMinters;
    
    modifier onlyAuthorized() {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized to mint"
        );
        _;
    }
    
    constructor() ERC721("Pontiff Debate Victory", "VICTORY") Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedMinters[msg.sender] = true;
        _nextTokenId = 1; // Start token IDs at 1
    }
    
    /**
     * @dev Authorize an address to mint NFTs (for backend API)
     */
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }
    
    /**
     * @dev Mint a Victory NFT for a debate winner
     * @param winner Address of the debate winner
     * @param debateId Unique identifier for the debate (as bytes32)
     * @param topic The topic or title of the debate
     * @param uri URI pointing to NFT metadata JSON
     */
    function mintVictoryNFT(
        address winner,
        bytes32 debateId,
        string memory topic,
        string memory uri
    ) external onlyAuthorized returns (uint256) {
        require(winner != address(0), "Invalid winner address");
        require(debateToToken[debateId] == 0, "NFT already minted for this debate");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(winner, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Store metadata
        debateToToken[debateId] = tokenId;
        tokenMetadata[tokenId] = DebateMetadata({
            debateId: debateId,
            winner: winner,
            mintedAt: block.timestamp,
            topic: topic
        });
        
        emit VictoryNFTMinted(tokenId, debateId, winner, topic);
        
        return tokenId;
    }
    
    /**
     * @dev Check if an NFT was already minted for a debate
     */
    function isDebateMinted(bytes32 debateId) external view returns (bool) {
        return debateToToken[debateId] != 0;
    }
    
    /**
     * @dev Get the token ID for a specific debate
     */
    function getTokenForDebate(bytes32 debateId) external view returns (uint256) {
        return debateToToken[debateId];
    }
    
    /**
     * @dev Get total supply of minted NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
