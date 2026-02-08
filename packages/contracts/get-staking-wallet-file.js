const { ethers } = require("ethers");
require('dotenv').config();
const fs = require('fs');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    const GUILT_ADDRESS = "0x5438DC9b8B5A314b85257c3C39746A0B4faE9611";
    const ABI = ["function stakingWallet() view returns (address)"];

    const guilt = new ethers.Contract(GUILT_ADDRESS, ABI, provider);
    const stakingWallet = await guilt.stakingWallet();
    console.log("Got wallet: " + stakingWallet);
    fs.writeFileSync('staking_address_utf8.txt', stakingWallet, 'utf8');
}

main();
