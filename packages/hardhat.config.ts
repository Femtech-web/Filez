import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const MNEMONIC =
  process.env.MNEMONIC ||
  "test test test test test test test test test test test junk";

const INFURA_API_KEY = process.env.INFURA_API_KEY || "xxxx";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

export default {
  defaultNetwork: "hardhat",

  namedAccounts: {
    deployer: 0,
  },

  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },

  gasReporter: {
    currency: "USD",
    enabled: !!process.env.REPORT_GAS,
  },

  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: MNEMONIC,
      },
    },

    sepolia: {
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [`0x${process.env.SEPOLIA_PRIVATE_KEY}`]
        : [],
      chainId: 11155111,
      url: "https://ethereum-sepolia-rpc.publicnode.com",
    },
  },

  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },

  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
};
