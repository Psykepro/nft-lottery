const { ethers, } = require("hardhat");
const { lotteryCfg } = require("../config/lottery.config")
const { HardhatChainId } = require("../constants/hardhat");
const { linkConfig } = require("../config/link.config");

require("dotenv").config();

async function main() {
  const chainId = process.env.CHAIN_ID;
  if (chainId === HardhatChainId) {
    throw Error("This script is not meant to be used for Local Hardhat Network.")
  }
  const linkCfg = linkConfig[chainId];
  if (!linkCfg) {
    throw Error("Unsupported network.")
  }
  const LotteryTicketNftFactory = await ethers.getContractFactory("LotteryTicketNftFactory");
  const lotteryTicketNftFactory = await LotteryTicketNftFactory.attach(lotteryCfg.factoryContractAddress);
  const params = [lotteryCfg.baseURI, lotteryCfg.ticketPrice, lotteryCfg.lotteryDurationInMinutes, linkCfg.vrfCoordinator, linkCfg.linkToken, linkCfg.keyHash, linkCfg.fee];
  const predictedAddress = await lotteryTicketNftFactory.predictAddressForLottery(...params);
  console.log("PredictedAddress: ", predictedAddress);
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});