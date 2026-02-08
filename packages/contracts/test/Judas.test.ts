import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("JudasProtocol (Tournament & Reputation)", function () {
    let judas: any;
    let sGuilt: any;
    let owner: any, user1: any, user2: any, treasury: any;

    // Constants
    const EPOCH_DURATION = 86400; // 24 hours

    beforeEach(async function () {
        [owner, user1, user2, treasury] = await ethers.getSigners();

        const GuiltTokenFactory = await ethers.getContractFactory("GuiltToken");
        try {
            sGuilt = await GuiltTokenFactory.deploy(owner.address, owner.address, owner.address, owner.address, owner.address);
        } catch (e) {
            console.log("GuiltToken deploy failed with 5 args, trying 3 args fallback");
            sGuilt = await GuiltTokenFactory.deploy(owner.address, owner.address, owner.address);
        }
        await sGuilt.waitForDeployment();
        const sGuiltAddr = await sGuilt.getAddress();

        // Deploy Judas Protocol
        const JudasProtocol = await ethers.getContractFactory("JudasProtocol");
        judas = await JudasProtocol.deploy(sGuiltAddr, owner.address, treasury.address);
        await judas.waitForDeployment();
        const judasAddr = await judas.getAddress();

        // 3. Fund Users & Approve
        await sGuilt.transfer(user1.address, ethers.parseEther("1000"));
        await sGuilt.transfer(user2.address, ethers.parseEther("1000"));

        await sGuilt.connect(user1).approve(judasAddr, ethers.MaxUint256);
        await sGuilt.connect(user2).approve(judasAddr, ethers.MaxUint256);
    });

    it("Should start with Tournament 1, Round 1", async function () {
        const state = await judas.getTournamentState();
        expect(state[0]).to.equal(1n); // tournamentId
        expect(state[1]).to.equal(1n); // round
        expect(state[2]).to.equal(5n); // maxRounds
    });

    it("Should increment rounds and update reputation", async function () {
        // Round 1: User 1 Loyal, User 2 Betrayer
        await judas.connect(user1).deposit(ethers.parseEther("100"));

        await judas.connect(user2).deposit(ethers.parseEther("100"));
        await judas.connect(user2).signalBetrayal();

        // Resolve Round 1
        await time.increase(EPOCH_DURATION + 1);
        await judas.resolveEpoch();

        // User 1 withdraws to trigger reputation update
        await judas.connect(user1).withdraw(ethers.parseEther("10"));

        // User 2 withdraws
        await judas.connect(user2).withdraw(ethers.parseEther("10"));

        // Check Reputation
        const rep1 = await judas.getReputation(user1.address);
        expect(rep1[0]).to.equal(1n); // loyal
        expect(rep1[1]).to.equal(0n); // betrayed

        const rep2 = await judas.getReputation(user2.address);
        expect(rep2[0]).to.equal(0n); // loyal
        expect(rep2[1]).to.equal(1n); // betrayed

        // Check Round is now 2
        const state = await judas.getTournamentState();
        expect(state[1]).to.equal(2n);
    });
});
