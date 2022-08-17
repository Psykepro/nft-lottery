require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@appliedblockchain/chainlink-plugins-fund-link");
require("dotenv").config();

const { HardhatChainId } = require("./constants/hardhat");

module.exports = {
  networks: {
    goerli: {
      url: `${process.env.ALCHEMY_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gasPrice: 1500000000,
      gas: 6000000,
    },
    
    hardhat: {
      chainId: HardhatChainId,
      accountsBalance: "100000000000000000000",
      gasLimit: 6000000,
      gasPrice: 1500000000,
    },
    mainnet: {
      chainId: 1,
      url: process.env.ALCHEMY_URL,
      chainId: 1,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API 
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.4.24",
      },
    ],
  }
};
