// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/JudasProtocol.sol";
import "../src/GuiltToken.sol";
import "../src/Staking.sol";

/**
 * Advanced Test Suite for JudasProtocol
 * Tests game theory mechanics, edge cases, and exploits
 */
contract JudasProtocolAdvancedTest is Test {
    JudasProtocol public judas;
    GuiltToken public guilt;
    Staking public staking;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);
    address public charlie = address(0x4);
    address public eve = address(0x5); // Attacker

    uint256 public constant EPOCH_DURATION = 24 hours;

    function setUp() public {
        // Deploy contracts
        guilt = new GuiltToken(treasury, treasury, treasury, treasury, owner);
        staking = new Staking(address(guilt), owner);
        judas = new JudasProtocol(address(staking), owner);

        // Distribute tokens
        guilt.transfer(alice, 10000 * 1e18);
        guilt.transfer(bob, 10000 * 1e18);
        guilt.transfer(charlie, 10000 * 1e18);
        guilt.transfer(eve, 10000 * 1e18);

        // Approve staking
        vm.prank(alice);
        guilt.approve(address(staking), type(uint256).max);
        vm.prank(bob);
        guilt.approve(address(staking), type(uint256).max);
        vm.prank(charlie);
        guilt.approve(address(staking), type(uint256).max);
        vm.prank(eve);
        guilt.approve(address(staking), type(uint256).max);
    }

    // ========== EPOCH MECHANICS ==========

    function testEpochInitialization() public {
        uint256 epoch = judas.getCurrentEpoch();
        (uint256 startTime, uint256 endTime, , , bool resolved, , ) = judas.epochs(epoch);

        assertEq(endTime - startTime, EPOCH_DURATION);
        assertFalse(resolved);
    }

    function testCannotResolveBeforeEpochEnd() public {
        vm.expectRevert("Epoch not ended");
        judas.resolveEpoch();
    }

    function testNewEpochStartsAfterResolution() public {
        uint256 epoch1 = judas.getCurrentEpoch();

        // Fast forward past epoch end
        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        // Resolve epoch
        judas.resolveEpoch();

        uint256 epoch2 = judas.getCurrentEpoch();
        assertEq(epoch2, epoch1 + 1);
    }

    // ========== BETRAYAL MECHANICS ==========

    function testSignalBetrayal() public {
        // Alice deposits and stays loyal
        vm.prank(alice);
        staking.stake(1000 * 1e18);

        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        // Bob deposits and betrays
        vm.prank(bob);
        staking.stake(1000 * 1e18);

        vm.prank(bob);
        judas.deposit(1000 * 1e18);

        vm.prank(bob);
        judas.signalBetrayal();

        // Verify betrayal status
        assertEq(judas.getUserStatus(bob), uint8(1)); // 1 = BETRAYER
    }

    function testCannotBetrayWithoutStake() public {
        vm.prank(eve);
        vm.expectRevert("No stake");
        judas.signalBetrayal();
    }

    function testCannotBetrayTwiceInSameEpoch() public {
        vm.prank(alice);
        staking.stake(1000 * 1e18);

        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        vm.prank(alice);
        judas.signalBetrayal();

        vm.prank(alice);
        vm.expectRevert("Already betrayed");
        judas.signalBetrayal();
    }

    // ========== FAILED COUP (<20%) ==========

    function testFailedCoup() public {
        // Alice: 9000 loyal
        vm.prank(alice);
        staking.stake(9000 * 1e18);
        vm.prank(alice);
        judas.deposit(9000 * 1e18);

        // Bob: 1000 betrays (10% of total)
        vm.prank(bob);
        staking.stake(1000 * 1e18);
        vm.prank(bob);
        judas.deposit(1000 * 1e18);
        vm.prank(bob);
        judas.signalBetrayal();

        // Warp to epoch end
        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        uint256 aliceBefore = judas.getUserStake(alice);
        uint256 bobBefore = judas.getUserStake(bob);

        // Resolve epoch
        judas.resolveEpoch();

        uint256 aliceAfter = judas.getUserStake(alice);
        uint256 bobAfter = judas.getUserStake(bob);

        // Failed coup: Bob loses 100%, Alice gains
        assertEq(bobAfter, 0);
        assertGt(aliceAfter, aliceBefore);

        // Bob should be marked as BETRAYER (1)
        assertEq(judas.getUserStatus(bob), 1); 
    }

    // ========== PARTIAL COUP (20-40%) ==========

    function testPartialCoup() public {
        // Alice: 7000 loyal (70%)
        vm.prank(alice);
        staking.stake(7000 * 1e18);
        vm.prank(alice);
        judas.deposit(7000 * 1e18);

        // Bob: 3000 betrays (30%)
        vm.prank(bob);
        staking.stake(3000 * 1e18);
        vm.prank(bob);
        judas.deposit(3000 * 1e18);
        vm.prank(bob);
        judas.signalBetrayal();

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        uint256 aliceBefore = judas.getUserStake(alice);
        uint256 bobBefore = judas.getUserStake(bob);

        judas.resolveEpoch();

        uint256 aliceAfter = judas.getUserStake(alice);
        uint256 bobAfter = judas.getUserStake(bob);

        // Partial coup: Betrayers steal 20% from loyalists
        uint256 stolen = (aliceBefore * 20) / 100;

        assertApproxEqAbs(aliceAfter, aliceBefore - stolen, 1e16);
        assertApproxEqAbs(bobAfter, bobBefore + stolen, 1e16);
    }

    // ========== FULL COUP (>40%) ==========

    function testFullCoup() public {
        // Alice: 4000 loyal (40%)
        vm.prank(alice);
        staking.stake(4000 * 1e18);
        vm.prank(alice);
        judas.deposit(4000 * 1e18);

        // Bob + Charlie: 6000 betrays (60%)
        vm.prank(bob);
        staking.stake(3000 * 1e18);
        vm.prank(bob);
        judas.deposit(3000 * 1e18);
        vm.prank(bob);
        judas.signalBetrayal();

        vm.prank(charlie);
        staking.stake(3000 * 1e18);
        vm.prank(charlie);
        judas.deposit(3000 * 1e18);
        vm.prank(charlie);
        judas.signalBetrayal();

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        uint256 aliceBefore = judas.getUserStake(alice);

        judas.resolveEpoch();

        uint256 aliceAfter = judas.getUserStake(alice);

        // Full coup: Betrayers steal 50% from loyalists
        uint256 stolen = (aliceBefore * 50) / 100;

        assertApproxEqAbs(aliceAfter, aliceBefore - stolen, 1e16);
    }

    // ========== EDGE CASES ==========

    function testAllLoyalNoBetrayal() public {
        // Everyone stays loyal
        vm.prank(alice);
        staking.stake(5000 * 1e18);
        vm.prank(alice);
        judas.deposit(5000 * 1e18);

        vm.prank(bob);
        staking.stake(5000 * 1e18);
        vm.prank(bob);
        judas.deposit(5000 * 1e18);

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        uint256 aliceBefore = judas.getUserStake(alice);
        uint256 bobBefore = judas.getUserStake(bob);

        judas.resolveEpoch();

        // No change if no betrayals
        assertEq(judas.getUserStake(alice), aliceBefore);
        assertEq(judas.getUserStake(bob), bobBefore);
    }

    function testAllBetray() public {
        // Everyone betrays
        vm.prank(alice);
        staking.stake(5000 * 1e18);
        vm.prank(alice);
        judas.deposit(5000 * 1e18);
        vm.prank(alice);
        judas.signalBetrayal();

        vm.prank(bob);
        staking.stake(5000 * 1e18);
        vm.prank(bob);
        judas.deposit(5000 * 1e18);
        vm.prank(bob);
        judas.signalBetrayal();

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        judas.resolveEpoch();

        // If everyone betrays, no one wins/loses
        assertGt(judas.getUserStake(alice), 0);
        assertGt(judas.getUserStake(bob), 0);
    }

    function testSingleParticipant() public {
        // Only Alice participates
        vm.prank(alice);
        staking.stake(10000 * 1e18);
        vm.prank(alice);
        judas.deposit(10000 * 1e18);

        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        uint256 aliceBefore = judas.getUserStake(alice);

        judas.resolveEpoch();

        // No change with single participant
        assertEq(judas.getUserStake(alice), aliceBefore);
    }

    // ========== WITHDRAWAL MECHANICS ==========

    function testCannotWithdrawDuringEpoch() public {
        vm.prank(alice);
        staking.stake(1000 * 1e18);
        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        vm.prank(alice);
        vm.expectRevert("Cannot withdraw during epoch");
        judas.withdraw(500 * 1e18);
    }

    function testWithdrawAfterEpochResolves() public {
        vm.prank(alice);
        staking.stake(1000 * 1e18);
        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        vm.warp(block.timestamp + EPOCH_DURATION + 1);
        judas.resolveEpoch();

        // Now in new epoch, can withdraw
        vm.prank(alice);
        judas.withdraw(500 * 1e18);

        assertEq(judas.getUserStake(alice), 500 * 1e18);
    }

    // ========== ATTACK VECTORS ==========

    function testFlashLoanExploit() public {
        // Attacker tries to:
        // 1. Flash loan huge amount
        // 2. Deposit and betray
        // 3. Resolve epoch
        // 4. Withdraw profit
        // 5. Repay flash loan

        // Give Eve massive tokens (simulating flash loan)
        guilt.transfer(eve, 1000000 * 1e18);

        // Legitimate users stake
        vm.prank(alice);
        staking.stake(10000 * 1e18);
        vm.prank(alice);
        judas.deposit(10000 * 1e18);

        // Eve stakes huge amount last second
        vm.prank(eve);
        staking.stake(1000000 * 1e18);
        vm.prank(eve);
        judas.deposit(1000000 * 1e18);
        vm.prank(eve);
        judas.signalBetrayal();

        // Epoch ends
        vm.warp(block.timestamp + EPOCH_DURATION + 1);

        vm.prank(eve);
        vm.expectRevert("Cannot withdraw during epoch");
        judas.withdraw(1000000 * 1e18); // Cannot withdraw immediately

        // This exploit is prevented by epoch locking
    }

    function testGriefingAttack() public {
        // Attacker deposits 1 wei to lock epoch
        vm.prank(eve);
        staking.stake(1);
        vm.prank(eve);
        judas.deposit(1);

        // Legitimate users can still participate
        vm.prank(alice);
        staking.stake(1000 * 1e18);
        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        // Epoch still resolves normally
        vm.warp(block.timestamp + EPOCH_DURATION + 1);
        judas.resolveEpoch();

        assertGt(judas.getUserStake(alice), 0);
    }

    // ========== HELPERS ==========

    function getUserStake(address user) internal view returns (uint256) {
        (uint256 amount, , ) = judas.getUserPosition(user);
        return amount;
    }

    function getUserStatus(address user) internal view returns (uint8) {
        (, bool isBetrayer, ) = judas.getUserPosition(user);
        return isBetrayer ? 1 : 0;
    }

    // ========== TOURNAMENT & REPUTATION ==========

    function testTournamentAndReputation() public {
        // Round 1: Alice stays loyal
        vm.prank(alice);
        staking.stake(1000 * 1e18);
        vm.prank(alice);
        judas.deposit(1000 * 1e18);

        // Bob betrays
        vm.prank(bob);
        staking.stake(1000 * 1e18);
        vm.prank(bob);
        judas.deposit(1000 * 1e18);
        vm.prank(bob);
        judas.signalBetrayal();

        // End Round 1
        vm.warp(block.timestamp + EPOCH_DURATION + 1);
        judas.resolveEpoch();

        // Check Reputation Update (requires claim/withdraw)
        // Alice withdraws to trigger update
        vm.prank(alice);
        judas.withdraw(100 * 1e18); // Withdraw some to trigger claim

        // Bob withdraws
        vm.prank(bob);
        judas.withdraw(100 * 1e18); 

        (uint32 aliceLoyal, uint32 aliceBetrayed) = judas.getReputation(alice);
        (uint32 bobLoyal, uint32 bobBetrayed) = judas.getReputation(bob);

        assertEq(aliceLoyal, 1);
        assertEq(aliceBetrayed, 0);
        assertEq(bobLoyal, 0);
        assertEq(bobBetrayed, 1);

        // Verify Tournament Round incremented
        (, uint256 round, ) = judas.getTournamentState();
        assertEq(round, 2);
    }
}
