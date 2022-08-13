require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

require("dotenv").config();

module.exports = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: `${process.env.ALCHEMY_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gasPrice: 1500000000,
      gas: 6000000,
    },
    hardhat: {
      accountsBalance: "100000000000000000000",
      gasLimit: 6000000,
      gasPrice: 1500000000,
    },
},
  etherscan: {
    apiKey: process.env.ETHERSCAN_API 
  },

};
