import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + '/../../apps/web/.env.local' });
dotenv.config();

console.log("DEBUG: Loading Hardhat Config");
console.log("RPC URL:", process.env.NEXT_PUBLIC_RPC_URL ? "Found" : "Missing");
console.log("Deployer Key:", process.env.DEPLOYER_PRIVATE_KEY ? "Found" : "Missing");

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    paths: {
        sources: "./src",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    networks: {
        monadTestnet: {
            url: process.env.NEXT_PUBLIC_RPC_URL || "https://monad-testnet.drpc.org",
            chainId: 10143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            timeout: 180000,
            gasMultiplier: 1.2,
        },
    },
    etherscan: {
        apiKey: {
            monadTestnet: "test",
        },
        customChains: [
            {
                network: "monadTestnet",
                chainId: 10143,
                urls: {
                    apiURL: "https://api-testnet.monadscan.com/api",
                    browserURL: "https://testnet.monadscan.com"
                }
            }
        ]
    }
};

export default config;
