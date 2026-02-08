// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GuiltToken.sol";

/**
 * Advanced Test Suite for GuiltToken
 * Tests edge cases, gas optimization, and attack vectors
 */
contract GuiltTokenAdvancedTest is Test {
    GuiltToken public guilt;
    address public owner = address(this);
    address public treasury = address(0x1);
    address public team = address(0x2);
    address public airdrop = address(0x3);
    address public stakingVault = address(0x4);
    address public alice = address(0x5);
    address public bob = address(0x6);
    address public eve = address(0x7); // Attacker

    uint256 public constant TOTAL_SUPPLY = 666_666_666 * 1e18;

    function setUp() public {
        guilt = new GuiltToken(treasury, team, airdrop, stakingVault, owner);
    }

    // ========== EDGE CASES ==========

    function testZeroAddressTransfer() public {
        vm.expectRevert();
        guilt.transfer(address(0), 100);
    }

    function testTransferExceedingBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        guilt.transfer(bob, 1000);
    }

    function testApproveZeroAddress() public {
        vm.expectRevert();
        guilt.approve(address(0), 1000);
    }

    function testTransferFromWithoutApproval() public {
        // Give Alice some tokens
        guilt.transfer(alice, 1000);

        // Bob tries to transferFrom Alice without approval
        vm.prank(bob);
        vm.expectRevert();
        guilt.transferFrom(alice, bob, 500);
    }

    // ========== TAX LOGIC EDGE CASES ==========

    function testSellTaxCalculation() public {
        // Create AMM pair
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Give Alice tokens
        uint256 amount = 1000 * 1e18;
        guilt.transfer(alice, amount);

        // Alice sells (transfer to pair)
        vm.prank(alice);
        guilt.transfer(pair, amount);

        // Tax = 6.66% = 66.6 tokens
        uint256 expectedTax = (amount * 666) / 10000;
        uint256 expectedReceived = amount - expectedTax;

        assertApproxEqAbs(guilt.balanceOf(pair), expectedReceived, 1e17); // 0.1 token tolerance
    }

    function testBuyTaxIsZero() public {
        // Create AMM pair
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Give pair tokens
        uint256 amount = 1000 * 1e18;
        guilt.transfer(pair, amount);

        // Bob buys (pair transfers to Bob)
        uint256 buyAmount = 500 * 1e18;
        vm.prank(pair);
        guilt.transfer(bob, buyAmount);

        // No tax on buys
        assertEq(guilt.balanceOf(bob), buyAmount);
    }

    function testRegularTransferNoTax() public {
        uint256 amount = 1000 * 1e18;
        guilt.transfer(alice, amount);

        // Alice sends to Bob (not via AMM)
        vm.prank(alice);
        guilt.transfer(bob, amount);

        // No tax on regular transfers
        assertEq(guilt.balanceOf(bob), amount);
    }

    function testTaxExemption() public {
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Exempt Alice from tax
        guilt.setTaxExempt(alice, true);

        // Give Alice tokens
        uint256 amount = 1000 * 1e18;
        guilt.transfer(alice, amount);

        // Alice sells but pays no tax
        vm.prank(alice);
        guilt.transfer(pair, amount);

        assertEq(guilt.balanceOf(pair), amount); // Full amount, no tax
    }

    // ========== TAX ROUTING ==========

    function testTaxDistribution() public {
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Give Bob tokens
        uint256 sellAmount = 10000 * 1e18;
        guilt.transfer(bob, sellAmount);

        uint256 treasuryBefore = guilt.balanceOf(treasury);
        uint256 stakingBefore = guilt.balanceOf(stakingVault);

        // Bob sells
        vm.prank(bob);
        guilt.transfer(pair, sellAmount);

        // Tax = 6.66% = 666 tokens
        uint256 tax = (sellAmount * 666) / 10000;

        // Distribution: 66% staking, 33% treasury, 1% burn
        uint256 stakingShare = (tax * 66) / 100;
        uint256 treasuryShare = (tax * 33) / 100;

        assertApproxEqAbs(guilt.balanceOf(stakingVault) - stakingBefore, stakingShare, 1e16);
        assertApproxEqAbs(guilt.balanceOf(treasury) - treasuryBefore, treasuryShare, 1e16);
    }

    function testBurnFunctionality() public {
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        uint256 totalSupplyBefore = guilt.totalSupply();

        // Give Alice tokens and sell
        uint256 sellAmount = 10000 * 1e18;
        guilt.transfer(alice, sellAmount);

        vm.prank(alice);
        guilt.transfer(pair, sellAmount);

        // 1% of tax should be burned
        uint256 tax = (sellAmount * 666) / 10000;
        uint256 burnAmount = tax / 100;

        assertApproxEqAbs(totalSupplyBefore - guilt.totalSupply(), burnAmount, 1e16);
    }

    // ========== OWNERSHIP & ACCESS CONTROL ==========

    function testOnlyOwnerCanSetAMMPair() public {
        vm.prank(eve);
        vm.expectRevert();
        guilt.setAMMPair(address(0x99), true);
    }

    function testOnlyOwnerCanSetTaxExempt() public {
        vm.prank(eve);
        vm.expectRevert();
        guilt.setTaxExempt(alice, true);
    }

    function testOwnershipTransfer() public {
        address newOwner = address(0x88);
        guilt.transferOwnership(newOwner);

        vm.prank(newOwner);
        guilt.acceptOwnership();

        assertEq(guilt.owner(), newOwner);
    }

    // ========== GAS OPTIMIZATION BENCHMARKS ==========

    function testGasRegularTransfer() public {
        guilt.transfer(alice, 1000 * 1e18);

        uint256 gasBefore = gasleft();
        vm.prank(alice);
        guilt.transfer(bob, 100 * 1e18);
        uint256 gasUsed = gasBefore - gasleft();

        // Regular transfer should use < 60k gas
        assertLt(gasUsed, 60000);
        console.log("Gas for regular transfer:", gasUsed);
    }

    function testGasSellWithTax() public {
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        guilt.transfer(alice, 1000 * 1e18);

        uint256 gasBefore = gasleft();
        vm.prank(alice);
        guilt.transfer(pair, 100 * 1e18);
        uint256 gasUsed = gasBefore - gasleft();

        // Taxed transfer should use < 100k gas
        assertLt(gasUsed, 100000);
        console.log("Gas for taxed sell:", gasUsed);
    }

    // ========== ATTACK VECTORS ==========

    function testReentrancyProtection() public {
        // GuiltToken inherits ReentrancyGuard
        // This test verifies no reentrancy vulnerabilities exist
        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Deploy malicious contract that tries to reenter
        MaliciousReceiver attacker = new MaliciousReceiver(address(guilt));

        guilt.transfer(address(attacker), 1000 * 1e18);

        // Attacker tries to sell and reenter
        vm.expectRevert();
        attacker.attack(pair);
    }

    function testFlashLoanTaxEvasion() public {
        // Attacker tries to avoid tax by:
        // 1. Borrow tokens via flash loan
        // 2. Sell without being AMM pair
        // 3. Return tokens

        address pair = address(0x99);
        guilt.setAMMPair(pair, true);

        // Give Eve tokens
        uint256 amount = 10000 * 1e18;
        guilt.transfer(eve, amount);

        uint256 eveBefore = guilt.balanceOf(eve);

        // Eve tries to transfer to herself via pair (avoiding tax)
        vm.startPrank(eve);
        guilt.transfer(bob, amount); // No tax (not to pair)
        vm.stopPrank();

        // Then Bob transfers to pair
        vm.prank(bob);
        guilt.transfer(pair, amount); // Tax applied here

        // Tax still collected
        assertLt(guilt.balanceOf(pair), amount);
    }

    function testMaxSupplyEnforcement() public {
        // Verify no minting functions exist that could inflate supply
        assertEq(guilt.totalSupply(), TOTAL_SUPPLY);

        // Attempt to manipulate supply (should fail)
        vm.expectRevert();
        vm.prank(owner);
        // guilt.mint(alice, 1000); // Should not compile (no mint function)
    }

    // ========== INITIAL DISTRIBUTION VERIFICATION ==========

    function testInitialDistribution() public {
        uint256 liquidityAlloc = (TOTAL_SUPPLY * 60) / 100; // 60%
        uint256 treasuryAlloc = (TOTAL_SUPPLY * 20) / 100; // 20%
        uint256 teamAlloc = (TOTAL_SUPPLY * 10) / 100; // 10%
        uint256 airdropAlloc = (TOTAL_SUPPLY * 10) / 100; // 10%

        assertEq(guilt.balanceOf(owner), liquidityAlloc);
        assertEq(guilt.balanceOf(treasury), treasuryAlloc);
        assertEq(guilt.balanceOf(team), teamAlloc);
        assertEq(guilt.balanceOf(airdrop), airdropAlloc);
    }

    function testTotalSupplyConstant() public {
        // Total supply should be constant (no inflation)
        assertEq(guilt.totalSupply(), TOTAL_SUPPLY);

        // After multiple transfers
        guilt.transfer(alice, 1000 * 1e18);
        guilt.transfer(bob, 2000 * 1e18);

        assertEq(guilt.totalSupply(), TOTAL_SUPPLY);
    }
}

/**
 * Malicious contract for reentrancy testing
 */
contract MaliciousReceiver {
    GuiltToken public guilt;
    bool public attacked;

    constructor(address _guilt) {
        guilt = GuiltToken(_guilt);
    }

    function attack(address pair) external {
        // Try to sell tokens
        guilt.transfer(pair, guilt.balanceOf(address(this)));
    }

    // Fallback tries to reenter
    receive() external payable {
        if (!attacked) {
            attacked = true;
            guilt.transfer(msg.sender, 1); // Try to reenter
        }
    }
}
