// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingCathedralV2
 * @dev The "Bank" of the Pontiff ecosystem.
 * 
 * V2 FIXES:
 * - Fixed `stake()` first deposit crash by minting minimum liquidity to 0xdEaD instead of address(0).
 * 
 * MECHANISM (The Passive Vault):
 * - Users deposit $GUILT -> Receive $sGUILT (Shares).
 * - 6.66% tax from $GUILT sells are sent directly to this contract.
 * - This increases `totalAssets`, meaning each Share is worth more $GUILT.
 * - PricePerShare = (balanceOf(Guilt) / totalSupply(sGuilt)).
 * 
 * TIERS:
 * - Basic Staking: available immediately.
 */
contract StakingCathedralV2 is ERC20, Ownable, ReentrancyGuard {
    IERC20 public immutable asset; // $GUILT Token

    // Fairness/Security
    uint256 private constant MINIMUM_LIQUIDITY = 1000;

    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);

    constructor(IERC20 _asset, address _initialOwner) 
        ERC20("Staked Guilt", "sGUILT") 
        Ownable(_initialOwner) 
    {
        asset = _asset;
    }

    // =============================================================
    // VIEW FUNCTIONS (Price Logic)
    // =============================================================

    /**
     * @dev Total amount of $GUILT controlled by the Cathedral
     */
    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    /**
     * @dev Calculate how many Shares a Deposit of `assets` is worth
     */
    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        // If empty, 1:1 ratio
        if (supply == 0) return assets;
        
        // Shares = (Assets * TotalShares) / TotalAssets
        return (assets * supply) / totalAssets();
    }

    /**
     * @dev Calculate how many Assets `shares` are worth
     */
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return shares;

        // Assets = (Shares * TotalAssets) / TotalShares
        return (shares * totalAssets()) / supply;
    }

    // =============================================================
    // ACTIONS
    // =============================================================

    /**
     * @dev Deposit $GUILT to receive sGUILT shares
     */
    function stake(uint256 assets) external nonReentrant {
        require(assets > 0, "Zero deposit");
        
        uint256 shares;
        if (totalSupply() == 0) {
            // First depositor: Burn minimal liquidity to prevent inflation attack
            shares = assets - MINIMUM_LIQUIDITY;
            // FIX: Mint to 0xdEaD instead of address(0) because OZ v5 reverts on mint to 0
            _mint(0x000000000000000000000000000000000000dEaD, MINIMUM_LIQUIDITY); 
        } else {
            shares = convertToShares(assets);
        }

        require(shares > 0, "Trace deposit");

        // Transfer assets IN
        asset.transferFrom(msg.sender, address(this), assets);
        
        // Mint shares to user
        _mint(msg.sender, shares);

        emit Deposit(msg.sender, assets, shares);
    }

    /**
     * @dev Redeem sGUILT shares for $GUILT (Principal + Yield)
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Zero withdraw");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");

        uint256 assets = convertToAssets(shares);
        require(assets > 0, "Trace withdraw");

        // Burn shares
        _burn(msg.sender, shares);

        // Send assets OUT
        asset.transfer(msg.sender, assets);

        emit Withdraw(msg.sender, assets, shares);
    }
}
