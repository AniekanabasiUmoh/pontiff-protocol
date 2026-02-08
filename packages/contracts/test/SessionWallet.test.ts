
import { expect } from "chai";
import { ethers } from "hardhat";
import {
    SessionWallet,
    SessionWalletFactory,
    GuiltToken, // Assuming this exists or using Mock
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SessionWallet System", function () {
    let factory: SessionWalletFactory;
    let guiltToken: any; // using any for simplicity if types vary on mock
    let owner: SignerWithAddress;
    let pontiff: SignerWithAddress;
    let user: SignerWithAddress;
    let hacker: SignerWithAddress;
    let sessionWalletAddress: string;
    let sessionWallet: SessionWallet;

    before(async function () {
        [owner, pontiff, user, hacker] = await ethers.getSigners();
    });

    it("Should deploy GuiltToken and Factory", async function () {
        // Deploy GuiltToken with correct arguments: _initialOwner, _treasury, _staking
        const GuiltTokenFactory = await ethers.getContractFactory("GuiltToken");
        // We use owner address for all roles for testing
        guiltToken = await GuiltTokenFactory.deploy(owner.address, owner.address, owner.address);
        await guiltToken.waitForDeployment();

        const Factory = await ethers.getContractFactory("SessionWalletFactory");
        factory = await Factory.deploy(await guiltToken.getAddress(), pontiff.address);
        await factory.waitForDeployment();

        expect(await factory.pontiff()).to.equal(pontiff.address);
    });

    it("Should create a Session Wallet for User", async function () {
        const tx = await factory.connect(user).createSession();
        const receipt = await tx.wait();

        // Find event
        // The event is SessionCreated(address indexed user, address indexed sessionWallet, uint256 timestamp)
        // We can filter logs or query the mapping
        const sessions = await factory.getUserSessions(user.address);
        expect(sessions.length).to.equal(1);
        sessionWalletAddress = sessions[0];

        sessionWallet = await ethers.getContractAt("SessionWallet", sessionWalletAddress);

        expect(await sessionWallet.owner()).to.equal(user.address);
        expect(await sessionWallet.pontiff()).to.equal(pontiff.address);
    });

    it("Should allow User to fund the wallet", async function () {
        // Mint tokens to user first
        await guiltToken.mint(user.address, ethers.parseEther("100"));
        await guiltToken.connect(user).transfer(sessionWalletAddress, ethers.parseEther("50"));

        expect(await guiltToken.balanceOf(sessionWalletAddress)).to.equal(ethers.parseEther("50"));
    });

    it("Should allow Pontiff to execute a game (simulated)", async function () {
        // Simulate a game call. We can call a function on the token contract for simplicity
        // e.g. approve spender.
        // Pontiff calls executeGame(target, data)

        const spender = hacker.address;
        const amount = ethers.parseEther("10");
        const data = guiltToken.interface.encodeFunctionData("approve", [spender, amount]);

        // User cannot execute
        await expect(
            sessionWallet.connect(user).executeGame(await guiltToken.getAddress(), data)
        ).to.be.revertedWith("SessionWallet: Only Pontiff can execute");

        // Pontiff executes
        await sessionWallet.connect(pontiff).executeGame(await guiltToken.getAddress(), data);

        // Verify approval happened
        // Note: SessionWallet blindly approves target (GuiltToken) max uint256 in executeGame before call.
        // But the payload data is ALSO an approve call.
        // The SessionWallet contract calls: guiltToken.approve(target, max); THEN target.call(data).
        // Here target IS guiltToken. So it approves itself? That's fine.
        // Then it calls guiltToken.approve(spender, amount). 
        // So ensuring allowance is updated.

        expect(await guiltToken.allowance(sessionWalletAddress, spender)).to.equal(amount);
    });

    it("Should allow User to withdraw funds", async function () {
        const initialBalance = await guiltToken.balanceOf(user.address);
        const walletBalance = await guiltToken.balanceOf(sessionWalletAddress);

        await sessionWallet.connect(user).withdraw();

        const finalBalance = await guiltToken.balanceOf(user.address);
        expect(finalBalance).to.equal(initialBalance + walletBalance);
        expect(await guiltToken.balanceOf(sessionWalletAddress)).to.equal(0);
    });

    it("Should allow Pontiff to withdraw funds (Session Expiry)", async function () {
        // Fund again
        await guiltToken.connect(user).transfer(sessionWalletAddress, ethers.parseEther("10"));

        // Pontiff withdraws to OWNER (not to self)
        const initialBalance = await guiltToken.balanceOf(user.address);
        await sessionWallet.connect(pontiff).withdraw();

        const finalBalance = await guiltToken.balanceOf(user.address);
        expect(finalBalance).to.equal(initialBalance + ethers.parseEther("10"));
    });
});
