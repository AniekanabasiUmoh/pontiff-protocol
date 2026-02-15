import { expect } from "chai";
import { ethers } from "hardhat";

describe("Simple Test", function () {
    it("Should pass", async function () {
        const signers = await ethers.getSigners();
        expect(signers.length).to.be.greaterThan(0);
    });
});
