
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const RECIPIENT = "0x9f5D2338A996d92D66838cc3f5928dC4Efc08cc3"; // The user's address
const AMOUNT_TO_SEND = "10000"; // 10,000 GUILT

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Funding user ${RECIPIENT} from ${deployer.address}...`);

    // Load Guilt Token Contract
    // Read address from .env or config, but simplified for this script:
    // We need to know the GUILT contract address. 
    // It is in apps/web/.env.local: 0x5438DC9b8B5A314b85257c3C39746A0B4faE9611

    const GUILT_ADDRESS = "0x5438DC9b8B5A314b85257c3C39746A0B4faE9611";

    const GuiltToken = await ethers.getContractAt("GuiltToken", GUILT_ADDRESS);
    const decimals = await GuiltToken.decimals();
    const amount = ethers.parseUnits(AMOUNT_TO_SEND, decimals);

    // Check balance
    const balance = await GuiltToken.balanceOf(deployer.address);
    console.log(`Deployer Balance: ${ethers.formatUnits(balance, decimals)} GUILT`);

    if (balance < amount) {
        console.error("Insufficient balance!");
        return;
    }

    // Transfer
    console.log(`Transferring ${AMOUNT_TO_SEND} GUILT...`);
    const tx = await GuiltToken.transfer(RECIPIENT, amount);
    console.log(`Tx sent: ${tx.hash}`);

    await tx.wait();
    console.log("Transfer successful!");

    const newBalance = await GuiltToken.balanceOf(RECIPIENT);
    console.log(`Recipient New Balance: ${ethers.formatUnits(newBalance, decimals)} GUILT`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
