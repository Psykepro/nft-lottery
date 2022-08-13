const { BigNumber } = require("ethers");
const { ethers, } = require("hardhat");
const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")

async function main() {
  const LotteryTicketNftFactory = await ethers.getContractFactory("LotteryTicketNftFactory");
  const lotteryTicketNftFactory = await LotteryTicketNftFactory.attach(lotteryCfg.factoryContractAddress);
  const params = [lotteryCfg.baseURI, lotteryCfg.ticketPrice, lotteryCfg.lotteryDurationInMinutes];
  const predictedAddress = await lotteryTicketNftFactory.predictAddressForLottery(...params);
  console.log("PredictedAddress: ", predictedAddress);
  lotteryTicketNftFactory.on("CreatedLotteryProxy", (addr, salt) => {
    console.log("[event:CreatedLotteryProxy]: addr: %s, salt: %s", addr, salt);
  });
  const tx = await lotteryTicketNftFactory.createLottery(...params);
  await awaitReceipt(tx, `LotteryTicketNft (Proxy) deployed at: ${predictedAddress}`, "Failed to deploy LotteryTicketNft (Proxy).")
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});