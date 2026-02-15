import { ethers } from 'ethers';
import * as fs from 'fs';

const rpsInterface = new ethers.Interface([
    "event GameCreated(uint256 indexed gameId, address indexed player, uint256 wager)"
]);

const topicHash = rpsInterface.getEvent("GameCreated")?.topicHash;
console.log("Expected GameCreated Topic Hash:", topicHash);

// Variations
const v1 = ethers.keccak256(ethers.toUtf8Bytes("GameCreated(uint256,address,uint256)"));
console.log("Variation 1 (no indexed):", v1);

const v2 = ethers.keccak256(ethers.toUtf8Bytes("GameCreated(uint256,address,uint256)"));
console.log("Variation 2:", v2);

const iface2 = new ethers.Interface(["event GameCreated(uint256 gameId, address player, uint256 wager)"]);
console.log("Interface (no indexed keywords):", iface2.getEvent("GameCreated")?.topicHash);

// Brute force to find 0x7dfb67e9ff596fca4da65c7eedb128cd1aac553

const target = "0x7dfb67e9ff596fca4da65c7eedb128cd1aac553";
console.log("Target:", target);

const signatures = [
    "GameCreated(uint256,address,uint256)",
    "GameCreated(uint256,address,uint256)", // Same
    "GameCreated(uint,address,uint)",
    "GameCreated(uint256,address)",
    "GameCreated(address,uint256)",
    "GameCreated(uint256,uint256,uint256)",
    "GameCreated(uint256,uint256)",
    "GameCreated(address,uint256,uint256)",
    "GameCreated(uint256,address,uint256,uint256)",
    "GameCreated(uint256,address,uint256,bool)",
    "GameCreated(uint256,address,uint256,uint8)",
    "GameCreated(uint256,address,uint256,string)",
    "GameCreated(uint256,address,uint256,slice)",
    "GameCreated(uint256,address,uint256,bytes)",
];

signatures.forEach(sig => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(sig));
    console.log(`${sig} -> ${hash}`);
    if (hash.toLowerCase().startsWith(target.toLowerCase().substring(0, 10))) {
        console.log("MATCH FOUND!!!!");
    }
});
