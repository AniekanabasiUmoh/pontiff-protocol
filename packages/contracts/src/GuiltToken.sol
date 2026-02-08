// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuiltToken
 * @dev The official currency of The Pontiff.
 * 
 * TOKENOMICS:
 * - Supply: 666,666,666 (Fixed)
 * - Decimals: 18
 * 
 * ALLOCATION (Decided):
 * - Liquidity: 60% (399,999,999)
 * - Treasury: 20% (133,333,333)
 * - Team:     10% (66,666,666)
 * - Airdrop:  10% (66,666,666) -> For "Sinner" early adopters
 * 
 * TAX SYSTEM ("The Hotel California Model"):
 * - Buy Tax: 0% (You can check out any time you like)
 * - Sell Tax: 6.66% (But you can never leave... without paying)
 * 
 * ROUTING:
 * - 66% -> Staking (The Cathedral)
 * - 33% -> Treasury (Vatican Bank)
 * - 1%  -> Burn (Purgatory)
 */
contract GuiltToken is ERC20, Ownable {
    // Tax Rates (Basis Points: 100 = 1%)
    uint256 public constant SELL_TAX_BPS = 666; // 6.66%
    uint256 public constant MAX_BPS = 10000;

    // Wallets
    address public treasuryWallet;
    address public stakingWallet;
    
    // Automation detection
    mapping(address => bool) public isAutomatedMarketMakerPair;
    mapping(address => bool) public isTaxExempt;

    event TaxPaid(address indexed sender, uint256 amount);
    event PairUpdated(address indexed pair, bool value);
    event ExemptUpdated(address indexed account, bool value);

    constructor(address _initialOwner, address _treasury, address _staking) 
        ERC20("Guilt", "GUILT") 
        Ownable(_initialOwner) 
    {
        require(_treasury != address(0), "Invalid treasury");
        require(_staking != address(0), "Invalid staking");

        treasuryWallet = _treasury;
        stakingWallet = _staking;

        // Exempt owner and contract itself from taxes
        isTaxExempt[_initialOwner] = true;
        isTaxExempt[address(this)] = true;
        isTaxExempt[_treasury] = true;
        isTaxExempt[_staking] = true;

        // Mint fixed supply to owner (who will add LP)
        _mint(_initialOwner, 666_666_666 * 10 ** decimals());
    }

    /**
     * @dev Set a pair definition (e.g. Uniswap pair) to identify Buys/Sells
     */
    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        require(pair != address(0), "Invalid pair");
        isAutomatedMarketMakerPair[pair] = value;
        emit PairUpdated(pair, value);
    }

    /**
     * @dev Exempt a wallet from taxes (e.g. CEX, Router)
     */
    function setTaxExempt(address account, bool value) external onlyOwner {
        isTaxExempt[account] = value;
        emit ExemptUpdated(account, value);
    }

    /**
     * @dev Update wallet addresses
     */
    function updateWallets(address _treasury, address _staking) external onlyOwner {
        require(_treasury != address(0) && _staking != address(0), "Invalid addresses");
        treasuryWallet = _treasury;
        stakingWallet = _staking;
    }

    /**
     * @dev Override _update to implement tax logic
     * Using _update (OpenZeppelin v5) instead of _transfer
     */
    function _update(address from, address to, uint256 value) internal override {
        // If 0 value or minting/burning, just do standard transfer
        if (value == 0 || from == address(0) || to == address(0)) {
            super._update(from, to, value);
            return;
        }

        // Check exemptions
        bool isExempt = isTaxExempt[from] || isTaxExempt[to];
        uint256 taxAmount = 0;

        if (!isExempt) {
            // SELL: Transfer TO a Pair (and sender is not exempt)
            if (isAutomatedMarketMakerPair[to]) {
                taxAmount = (value * SELL_TAX_BPS) / MAX_BPS;
            }
            // BUY: Transfer FROM a Pair (No tax currently, but logic helps extensibility)
            else if (isAutomatedMarketMakerPair[from]) {
                // taxAmount = 0; 
            }
        }

        if (taxAmount > 0) {
            // Distribute Taxes
            // 66% Staking, 33% Treasury, 1% Burn
            
            // Note: 6.66% tax is split roughly:
            // 4.40% Staking
            // 2.20% Treasury
            // 0.06% Burn
            
            uint256 burnShare = taxAmount / 100; // 1% of tax
            uint256 treasuryShare = (taxAmount * 33) / 100; // 33% of tax
            uint256 stakingShare = taxAmount - burnShare - treasuryShare; // Remaining (~66%)

            // Execute transfers for tax portions
            if (burnShare > 0) {
                super._update(from, address(0), burnShare); // Burn
            }
            if (treasuryShare > 0) {
                super._update(from, treasuryWallet, treasuryShare);
            }
            if (stakingShare > 0) {
                super._update(from, stakingWallet, stakingShare);
            }

            emit TaxPaid(from, taxAmount);
            
            // Reduce amount received by recipient
            value -= taxAmount;
        }

        super._update(from, to, value);
    }
}
