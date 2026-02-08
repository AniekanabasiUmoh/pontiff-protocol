import { expect } from "chai";
import { ethers } from "hardhat";

describe("Pontiff Economy (Guilt + Staking)", function () {
    it("Should distribute taxes to Staking contract and increase share value", async function () {
        const [owner, user1, user2, treasury] = await ethers.getSigners();

        const GuiltToken = await ethers.getContractFactory("GuiltToken");
        const guilt = await GuiltToken.deploy(owner.address, treasury.address, owner.address);
        await guilt.waitForDeployment();
        const guiltAddress = await guilt.getAddress();

        const Staking = await ethers.getContractFactory("StakingCathedral");
        const staking = await Staking.deploy(guiltAddress, owner.address);
        await staking.waitForDeployment();
        const stakingAddress = await staking.getAddress();

        await guilt.updateWallets(treasury.address, stakingAddress);

        await guilt.setTaxExempt(owner.address, true);
        await guilt.setTaxExempt(stakingAddress, true);

        const mockPair = user2.address;
        await guilt.setAutomatedMarketMakerPair(mockPair, true);

        const initialBalance = ethers.parseEther("1000");
        await guilt.transfer(user1.address, initialBalance);

        await guilt.connect(user1).approve(stakingAddress, ethers.MaxUint256);
        const stakeAmount = ethers.parseEther("500");
        await staking.connect(user1).stake(stakeAmount);

        expect(await guilt.balanceOf(stakingAddress)).to.equal(stakeAmount);

        const sellAmount = ethers.parseEther("100");
        await guilt.connect(user1).transfer(mockPair, sellAmount);

        const stakingBalanceAfterTax = await guilt.balanceOf(stakingAddress);
        console.log("Staking Balance (Before Tax):", ethers.formatEther(stakeAmount));
        console.log("Staking Balance (After Tax):", ethers.formatEther(stakingBalanceAfterTax));

        expect(stakingBalanceAfterTax).to.be.gt(stakeAmount);

        const shareBalance = await staking.balanceOf(user1.address);
        await staking.connect(user1).withdraw(shareBalance);

        const finalUser1Balance = await guilt.balanceOf(user1.address);
        console.log("User1 Final Balance:", ethers.formatEther(finalUser1Balance));
    });
});
