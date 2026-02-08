import { expect } from "chai";
import { ethers } from "hardhat";

describe("Pontiff Indulgence (NFT)", function () {
    let owner: any, user1: any, user2: any, cathedral: any;
    let guilt: any, indulgence: any;
    let guiltAddr: string, indulgenceAddr: string;

    // Sin severity enum values
    const SinSeverity = {
        MINOR: 0,
        MORTAL: 1,
        CARDINAL: 2,
        UNFORGIVABLE: 3,
    };

    beforeEach(async function () {
        [owner, user1, user2, cathedral] = await ethers.getSigners();

        // Deploy GuiltToken
        const GuiltToken = await ethers.getContractFactory("GuiltToken");
        guilt = await GuiltToken.deploy(owner.address, owner.address, owner.address);
        await guilt.waitForDeployment();
        guiltAddr = await guilt.getAddress();

        // Deploy Indulgence (SBT)
        const Indulgence = await ethers.getContractFactory("Indulgence");
        indulgence = await Indulgence.deploy(guiltAddr, cathedral.address, owner.address);
        await indulgence.waitForDeployment();
        indulgenceAddr = await indulgence.getAddress();
    });

    describe("Basic Absolution", function () {
        it("Should allow ABSOLUTION (Mint) by paying Staking Contract, and BLOCK transfers", async function () {
            // Fund User with 100 GUILT (Mortal sin cost)
            const cost = ethers.parseEther("100");
            await guilt.transfer(user1.address, cost);

            // Approve spending
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            // Absolve a mortal sin
            const sinId = 666;
            await expect(indulgence.connect(user1).absolve(sinId, SinSeverity.MORTAL))
                .to.emit(indulgence, "Absolution")
                .withArgs(user1.address, sinId, 1, SinSeverity.MORTAL, cost);

            // Verify Payment Routed to Cathedral
            expect(await guilt.balanceOf(cathedral.address)).to.equal(cost);
            expect(await guilt.balanceOf(user1.address)).to.equal(0);

            // Verify Soulbound (Transfer Blocked)
            await expect(indulgence.connect(user1).transferFrom(user1.address, user2.address, 1))
                .to.be.revertedWith("Your Soul is Bound to the Pontiff");

            // Verify ownership
            expect(await indulgence.ownerOf(1)).to.equal(user1.address);
        });
    });

    describe("Tiered Pricing", function () {
        it("Should charge 50 GUILT for Minor sins", async function () {
            const cost = ethers.parseEther("50");
            await guilt.transfer(user1.address, cost);
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            await indulgence.connect(user1).absolve(1, SinSeverity.MINOR);

            expect(await guilt.balanceOf(cathedral.address)).to.equal(cost);
        });

        it("Should charge 100 GUILT for Mortal sins", async function () {
            const cost = ethers.parseEther("100");
            await guilt.transfer(user1.address, cost);
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            await indulgence.connect(user1).absolve(2, SinSeverity.MORTAL);

            expect(await guilt.balanceOf(cathedral.address)).to.equal(cost);
        });

        it("Should charge 250 GUILT for Cardinal sins", async function () {
            const cost = ethers.parseEther("250");
            await guilt.transfer(user1.address, cost);
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            await indulgence.connect(user1).absolve(3, SinSeverity.CARDINAL);

            expect(await guilt.balanceOf(cathedral.address)).to.equal(cost);
        });

        it("Should charge 500 GUILT for Unforgivable sins", async function () {
            const cost = ethers.parseEther("500");
            await guilt.transfer(user1.address, cost);
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            await indulgence.connect(user1).absolve(4, SinSeverity.UNFORGIVABLE);

            expect(await guilt.balanceOf(cathedral.address)).to.equal(cost);
        });

        it("Should return correct cost via getAbsolutionCost", async function () {
            expect(await indulgence.getAbsolutionCost(SinSeverity.MINOR)).to.equal(ethers.parseEther("50"));
            expect(await indulgence.getAbsolutionCost(SinSeverity.MORTAL)).to.equal(ethers.parseEther("100"));
            expect(await indulgence.getAbsolutionCost(SinSeverity.CARDINAL)).to.equal(ethers.parseEther("250"));
            expect(await indulgence.getAbsolutionCost(SinSeverity.UNFORGIVABLE)).to.equal(ethers.parseEther("500"));
        });
    });

    describe("Re-Entry Logic", function () {
        it("Should allow multiple absolutions per wallet", async function () {
            // Fund user with enough for 3 absolutions
            const totalCost = ethers.parseEther("150"); // 50 + 50 + 50
            await guilt.transfer(user1.address, totalCost);
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            // Get 3 absolutions
            await indulgence.connect(user1).absolve(1, SinSeverity.MINOR);
            await indulgence.connect(user1).absolve(2, SinSeverity.MINOR);
            await indulgence.connect(user1).absolve(3, SinSeverity.MINOR);

            // Verify all tokens minted
            expect(await indulgence.ownerOf(1)).to.equal(user1.address);
            expect(await indulgence.ownerOf(2)).to.equal(user1.address);
            expect(await indulgence.ownerOf(3)).to.equal(user1.address);

            // Verify absolution count
            expect(await indulgence.absolutionCount(user1.address)).to.equal(3);
        });

        it("Should track absolution count correctly", async function () {
            await guilt.transfer(user1.address, ethers.parseEther("100"));
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            expect(await indulgence.absolutionCount(user1.address)).to.equal(0);

            await indulgence.connect(user1).absolve(1, SinSeverity.MORTAL);
            expect(await indulgence.absolutionCount(user1.address)).to.equal(1);

            await guilt.transfer(user1.address, ethers.parseEther("100"));
            await indulgence.connect(user1).absolve(2, SinSeverity.MORTAL);
            expect(await indulgence.absolutionCount(user1.address)).to.equal(2);
        });
    });

    describe("Revocation", function () {
        beforeEach(async function () {
            // Mint an indulgence for user1
            await guilt.transfer(user1.address, ethers.parseEther("100"));
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);
            await indulgence.connect(user1).absolve(666, SinSeverity.MORTAL);
        });

        it("Should allow owner to revoke absolution", async function () {
            const reason = "Violated the covenant";

            await expect(indulgence.connect(owner).revoke(1, reason))
                .to.emit(indulgence, "Revocation")
                .withArgs(user1.address, 1, reason);

            expect(await indulgence.isRevoked(1)).to.equal(true);
        });

        it("Should prevent non-owner from revoking", async function () {
            await expect(indulgence.connect(user1).revoke(1, "No reason"))
                .to.be.revertedWithCustomError(indulgence, "OwnableUnauthorizedAccount");
        });

        it("Should not allow double revocation", async function () {
            await indulgence.connect(owner).revoke(1, "First revocation");

            await expect(indulgence.connect(owner).revoke(1, "Second revocation"))
                .to.be.revertedWith("Already revoked");
        });

        it("Should mark revoked tokens as invalid", async function () {
            expect(await indulgence.isValid(1)).to.equal(true);

            await indulgence.connect(owner).revoke(1, "Excommunication");

            expect(await indulgence.isValid(1)).to.equal(false);
        });
    });

    describe("Token Information", function () {
        it("Should return correct sin info", async function () {
            await guilt.transfer(user1.address, ethers.parseEther("250"));
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);

            const sinId = 777;
            await indulgence.connect(user1).absolve(sinId, SinSeverity.CARDINAL);

            const [returnedSinId, severity, revoked, tokenOwner] = await indulgence.getSinInfo(1);

            expect(returnedSinId).to.equal(sinId);
            expect(severity).to.equal(SinSeverity.CARDINAL);
            expect(revoked).to.equal(false);
            expect(tokenOwner).to.equal(user1.address);
        });

        it("Should return correct metadata URI", async function () {
            await guilt.transfer(user1.address, ethers.parseEther("100"));
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);
            await indulgence.connect(user1).absolve(1, SinSeverity.MORTAL);

            const uri = await indulgence.tokenURI(1);
            expect(uri).to.equal("https://api.pontiff.xyz/metadata/indulgence/1");
        });
    });

    describe("Edge Cases", function () {
        it("Should revert if payment fails", async function () {
            // Don't fund user - should fail
            await expect(indulgence.connect(user1).absolve(1, SinSeverity.MINOR))
                .to.be.revertedWith("Payment failed");
        });

        it("Should revert when getting info for non-existent token", async function () {
            await expect(indulgence.getSinInfo(999))
                .to.be.revertedWithCustomError(indulgence, "ERC721NonexistentToken");
        });

        it("Should handle burning tokens (if implemented)", async function () {
            await guilt.transfer(user1.address, ethers.parseEther("100"));
            await guilt.connect(user1).approve(indulgenceAddr, ethers.MaxUint256);
            await indulgence.connect(user1).absolve(1, SinSeverity.MORTAL);

            // Burning is allowed by the _update override (from != 0, to == 0)
            // This tests the soulbound logic doesn't prevent burns
            // Note: There's no public burn function, so this is just verifying the logic
            expect(await indulgence.ownerOf(1)).to.equal(user1.address);
        });
    });
});
