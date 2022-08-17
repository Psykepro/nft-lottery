
const { HardhatChainId } = require("../constants/hardhat");
const { BigNumber } = require("ethers");

const linkConfig = {
  // Hardhat local network
  // Mock Data (it won't work)
  [HardhatChainId]: {
    name: "hardhat",
    keyHash:
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
    fee: ethers.utils.parseUnits("0.1", 18),
    fundAmount: BigNumber.from("10000000000000000000"),
  },
  // Ethereum Mainnet
  1: {
    name: "mainnet",
    linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    vrfCoordinator: "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952",
    keyHash:
      "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445",
    fee: ethers.utils.parseUnits("2", 18),
  },
  // Goerli
  5: {
    name: "goerli",
    linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    vrfCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    fee: ethers.utils.parseUnits("0.25", 18),
    fundAmount: BigNumber.from("2000000000000000000"),
  },
};

module.exports = {
  linkConfig,
};