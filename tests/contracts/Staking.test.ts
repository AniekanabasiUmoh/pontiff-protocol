// Smart Contract Tests: GUILT Staking Contract
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GUILT Staking", function () {
  let guiltToken: Contract;
  let stakingContract: Contract;
  let owner: Signer;
  let staker1: Signer;
  let staker2: Signer;

  const STAKE_AMOUNT = ethers.utils.parseEther("100");
  const MIN_STAKE_PERIOD = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, staker1, staker2] = await ethers.getSigners();

    // Deploy GUILT token
    const GUILTToken = await ethers.getContractFactory("GUILT");
    guiltToken = await GUILTToken.deploy();
    await guiltToken.deployed();

    // Deploy Staking contract
    const Staking = await ethers.getContractFactory("GUILTStaking");
    stakingContract = await Staking.deploy(guiltToken.address);
    await stakingContract.deployed();

    // Mint tokens to stakers
    await guiltToken.mint(await staker1.getAddress(), ethers.utils.parseEther("1000"));
    await guiltToken.mint(await staker2.getAddress(), ethers.utils.parseEther("1000"));

    // Approve staking contract
    await guiltToken
      .connect(staker1)
      .approve(stakingContract.address, ethers.constants.MaxUint256);
    await guiltToken
      .connect(staker2)
      .approve(stakingContract.address, ethers.constants.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      expect(await stakingContract.guiltToken()).to.equal(guiltToken.address);
    });

    it("Should set the right owner", async function () {
      expect(await stakingContract.owner()).to.equal(await owner.getAddress());
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);

      const stakeInfo = await stakingContract.stakes(await staker1.getAddress());
      expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
    });

    it("Should transfer tokens to staking contract", async function () {
      const initialBalance = await guiltToken.balanceOf(stakingContract.address);

      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);

      const finalBalance = await guiltToken.balanceOf(stakingContract.address);
      expect(finalBalance).to.equal(initialBalance.add(STAKE_AMOUNT));
    });

    it("Should fail if staking zero amount", async function () {
      await expect(
        stakingContract.connect(staker1).stake(0)
      ).to.be.revertedWith("Cannot stake 0 tokens");
    });

    it("Should fail if user has insufficient balance", async function () {
      const tooMuch = ethers.utils.parseEther("10000");

      await expect(
        stakingContract.connect(staker1).stake(tooMuch)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should allow multiple users to stake", async function () {
      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);
      await stakingContract.connect(staker2).stake(STAKE_AMOUNT);

      const stake1 = await stakingContract.stakes(await staker1.getAddress());
      const stake2 = await stakingContract.stakes(await staker2.getAddress());

      expect(stake1.amount).to.equal(STAKE_AMOUNT);
      expect(stake2.amount).to.equal(STAKE_AMOUNT);
    });

    it("Should update total staked amount", async function () {
      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);
      await stakingContract.connect(staker2).stake(STAKE_AMOUNT);

      const totalStaked = await stakingContract.totalStaked();
      expect(totalStaked).to.equal(STAKE_AMOUNT.mul(2));
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      // Stake tokens first
      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);
    });

    it("Should fail if trying to unstake before minimum period", async function () {
      await expect(
        stakingContract.connect(staker1).unstake(STAKE_AMOUNT)
      ).to.be.revertedWith("Minimum stake period not met");
    });

    it("Should allow unstaking after minimum period", async function () {
      // Fast forward time
      await time.increase(MIN_STAKE_PERIOD + 1);

      const initialBalance = await guiltToken.balanceOf(await staker1.getAddress());

      await stakingContract.connect(staker1).unstake(STAKE_AMOUNT);

      const finalBalance = await guiltToken.balanceOf(await staker1.getAddress());
      expect(finalBalance).to.equal(initialBalance.add(STAKE_AMOUNT));
    });

    it("Should fail if unstaking more than staked", async function () {
      await time.increase(MIN_STAKE_PERIOD + 1);

      const tooMuch = STAKE_AMOUNT.add(ethers.utils.parseEther("1"));

      await expect(
        stakingContract.connect(staker1).unstake(tooMuch)
      ).to.be.revertedWith("Insufficient staked amount");
    });

    it("Should allow partial unstaking", async function () {
      await time.increase(MIN_STAKE_PERIOD + 1);

      const partialAmount = STAKE_AMOUNT.div(2);
      await stakingContract.connect(staker1).unstake(partialAmount);

      const stakeInfo = await stakingContract.stakes(await staker1.getAddress());
      expect(stakeInfo.amount).to.equal(STAKE_AMOUNT.sub(partialAmount));
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Stake tokens
      await stakingContract.connect(staker1).stake(STAKE_AMOUNT);
      await stakingContract.connect(staker2).stake(STAKE_AMOUNT);
    });

    it("Should distribute rewards proportionally", async function () {
      const rewardAmount = ethers.utils.parseEther("100");

      // Mint rewards to staking contract
      await guiltToken.mint(stakingContract.address, rewardAmount);

      // Distribute rewards
      await stakingContract.distributeRewards(rewardAmount);

      // Check pending rewards (should be 50/50 split)
      const reward1 = await stakingContract.pendingRewards(await staker1.getAddress());
      const reward2 = await stakingContract.pendingRewards(await staker2.getAddress());

      expect(reward1).to.be.closeTo(rewardAmount.div(2), ethers.utils.parseEther("0.01"));
      expect(reward2).to.be.closeTo(rewardAmount.div(2), ethers.utils.parseEther("0.01"));
    });

    it("Should allow users to claim rewards", async function () {
      const rewardAmount = ethers.utils.parseEther("100");

      await guiltToken.mint(stakingContract.address, rewardAmount);
      await stakingContract.distributeRewards(rewardAmount);

      const initialBalance = await guiltToken.balanceOf(await staker1.getAddress());

      await stakingContract.connect(staker1).claimRewards();

      const finalBalance = await guiltToken.balanceOf(await staker1.getAddress());
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
