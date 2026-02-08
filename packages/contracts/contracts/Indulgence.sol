// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Indulgence is ERC721, Ownable {
    enum Status {
        ABSOLVED,
        ACTIVE,
        EXCOMMUNICATED
    }
    
    struct Metadata {
        uint256 absolutionTime;
        uint256 guiltPaid;
        Status status;
        uint256 revocationTime;
    }
    
    mapping(uint256 => Metadata) private _metadata;
    mapping(uint256 => bool) private _revoked;
    
    // Multi-sig watcher configuration
    mapping(address => bool) public watchers;
    uint256 public requiredWatchers = 2;
    uint256 public watcherCount;
    
    // Rate limiting
    uint256 public maxRevocationsPerHour = 10;
    mapping(uint256 => uint256) private _revocationsPerHour; // hour => count
    
    uint256 private _tokenIdCounter;
    address public guiltToken;
    
    event Minted(uint256 indexed tokenId, address indexed owner, uint256 guiltPaid);
    event Revoked(uint256 indexed tokenId, address indexed owner, address indexed revoker);
    event WatcherAdded(address indexed watcher);
    event WatcherRemoved(address indexed watcher);
    
    constructor(address _guiltToken) ERC721("Indulgence", "INDLG") Ownable(msg.sender) {
        guiltToken = _guiltToken;
    }
    
    modifier onlyWatcher() {
        require(watchers[msg.sender], "Only watcher");
        _;
    }
    
    function addWatcher(address _watcher) external onlyOwner {
        require(!watchers[_watcher], "Already watcher");
        watchers[_watcher] = true;
        watcherCount++;
        emit WatcherAdded(_watcher);
    }
    
    function removeWatcher(address _watcher) external onlyOwner {
        require(watchers[_watcher], "Not a watcher");
        watchers[_watcher] = false;
        watcherCount--;
        emit WatcherRemoved(_watcher);
    }
    
    function setMaxRevocationsPerHour(uint256 _max) external onlyOwner {
        maxRevocationsPerHour = _max;
    }
    
    function mint(address to, uint256 guiltPaid) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        _metadata[tokenId] = Metadata({
            absolutionTime: block.timestamp,
            guiltPaid: guiltPaid,
            status: Status.ABSOLVED,
            revocationTime: 0
        });
        
        _safeMint(to, tokenId);
        
        emit Minted(tokenId, to, guiltPaid);
        
        return tokenId;
    }
    
    function revoke(uint256 tokenId) external onlyWatcher {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!_revoked[tokenId], "Already revoked");
        
        // Check rate limit
        uint256 currentHour = block.timestamp / 1 hours;
        require(
            _revocationsPerHour[currentHour] < maxRevocationsPerHour,
            "Rate limit exceeded"
        );
        
        // Update metadata
        _metadata[tokenId].status = Status.EXCOMMUNICATED;
        _metadata[tokenId].revocationTime = block.timestamp;
        _revoked[tokenId] = true;
        
        // Update rate limit counter
        _revocationsPerHour[currentHour]++;
        
        emit Revoked(tokenId, ownerOf(tokenId), msg.sender);
    }
    
    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revoked[tokenId];
    }
    
    function getMetadata(uint256 tokenId) external view returns (Metadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _metadata[tokenId];
    }
    
    // Soulbound: prevent transfers
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting and revocation, but not transfers
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: cannot transfer");
        }
        
        return super._update(to, tokenId, auth);
    }
}
