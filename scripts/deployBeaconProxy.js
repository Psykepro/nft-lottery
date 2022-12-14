const { ethers, } = require("hardhat");
const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")
const { autoFundCheck } = require("../utils/chainlink")
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
  lotteryTicketNftFactory.on("CreatedLotteryProxy", (addr, salt) => {
    console.log("[event:CreatedLotteryProxy]: addr: %s, salt: %s", addr, salt);
  });
  const tx = await lotteryTicketNftFactory.createLotteryProxy(...params);
  await awaitReceipt(tx, `LotteryTicketNft (Proxy) deployed at: ${predictedAddress}`, "Failed to deploy LotteryTicketNft (Proxy).")
  if (
    await autoFundCheck(
      predictedAddress,
      chainId,
      linkCfg.networkName,
      linkCfg.linkToken
    )
  ) {
    await hre.run("fund-link", {
      contract: predictedAddress,
      linkaddress: linkCfg.linkToken,
    });
  }
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});