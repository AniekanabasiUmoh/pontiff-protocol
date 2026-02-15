const { keccak256, toBytes } = require('viem');

const signatures = [
    "GameCreated(uint256,address,uint256)",
    "GameCreated(uint256,address,uint256,uint8)",
    "GameCreated(uint256,address,uint256,uint256)",
    "GameCreated(uint256,address,uint256,uint8,uint256)"
];

signatures.forEach(sig => {
    console.log(`SIG: ${sig}`);
    console.log(`HASH: ${keccak256(toBytes(sig))}`);
});
console.log('Target: 0x79cfcf64ee95f2f8fbda0bd025831724360c020432615f28aac21f03081e3db7');
