// Smart Contract Tests: GUILT Token
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("GUILT Token", function () {
  let guiltToken: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy GUILT token
    const GUILTToken = await ethers.getContractFactory("GUILT");
    guiltToken = await GUILTToken.deploy();
    await guiltToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await guiltToken.owner()).to.equal(await owner.getAddress());
    });

    it("Should have correct name and symbol", async function () {
      expect(await guiltToken.name()).to.equal("GUILT");
      expect(await guiltToken.symbol()).to.equal("GUILT");
    });

    it("Should have 18 decimals", async function () {
      expect(await guiltToken.decimals()).to.equal(18);
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await guiltToken.balanceOf(await owner.getAddress());
      expect(await guiltToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.utils.parseEther("50");

      // Transfer from owner to addr1
      await guiltToken.transfer(await addr1.getAddress(), amount);
      const addr1Balance = await guiltToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(amount);

      // Transfer from addr1 to addr2
      await guiltToken.connect(addr1).transfer(await addr2.getAddress(), amount);
      const addr2Balance = await guiltToken.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await guiltToken.balanceOf(await owner.getAddress());
      const amount = ethers.utils.parseEther("1");

      // Try to send more tokens than addr1 has
      await expect(
        guiltToken.connect(addr1).transfer(await owner.getAddress(), amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed
      expect(await guiltToken.balanceOf(await owner.getAddress())).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await guiltToken.balanceOf(await owner.getAddress());
      const amount1 = ethers.utils.parseEther("100");
      const amount2 = ethers.utils.parseEther("50");

      // Transfer to addr1
      await guiltToken.transfer(await addr1.getAddress(), amount1);

      // Transfer to addr2
      await guiltToken.transfer(await addr2.getAddress(), amount2);

      // Check final balances
      const finalOwnerBalance = await guiltToken.balanceOf(await owner.getAddress());
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(amount1).sub(amount2));

      const addr1Balance = await guiltToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(amount1);

      const addr2Balance = await guiltToken.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(amount2);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.utils.parseEther("1000");
      await guiltToken.mint(await addr1.getAddress(), amount);

      const addr1Balance = await guiltToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(amount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const amount = ethers.utils.parseEther("1000");

      await expect(
        guiltToken.connect(addr1).mint(await addr2.getAddress(), amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      const burnAmount = ethers.utils.parseEther("500");

      // Mint tokens to addr1
      await guiltToken.mint(await addr1.getAddress(), mintAmount);

      // Burn tokens
      await guiltToken.connect(addr1).burn(burnAmount);

      const addr1Balance = await guiltToken.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(mintAmount.sub(burnAmount));
    });

    it("Should fail if user tries to burn more than balance", async function () {
      const amount = ethers.utils.parseEther("1000");

      await expect(
        guiltToken.connect(addr1).burn(amount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Allowances", function () {
    it("Should approve and transferFrom correctly", async function () {
      const amount = ethers.utils.parseEther("100");

      // Owner approves addr1 to spend tokens
      await guiltToken.approve(await addr1.getAddress(), amount);

      // Check allowance
      const allowance = await guiltToken.allowance(
        await owner.getAddress(),
        await addr1.getAddress()
      );
      expect(allowance).to.equal(amount);

      // addr1 transfers from owner to addr2
      await guiltToken
        .connect(addr1)
        .transferFrom(await owner.getAddress(), await addr2.getAddress(), amount);

      const addr2Balance = await guiltToken.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(amount);
    });
  });
});
