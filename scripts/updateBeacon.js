const { ethers, } = require("hardhat");
const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")

async function main() {
  const LotteryTicketNftBlueprintV2 = await ethers.getContractFactory("LotteryTicketNftV2");
  const lotteryTicketNftBlueprintV2 = await LotteryTicketNftBlueprintV2.deploy();
  await lotteryTicketNftBlueprintV2.deployed();
  console.log(`LotteryTicketNft (Blueprint) V2 deployed at address: ${lotteryTicketNftBlueprintV2.address}`);

  const LotteryTicketNftBeacon = await ethers.getContractFactory("LotteryTicketNftBeacon");
  const lotteryTicketNftBeacon = await LotteryTicketNftBeacon.attach(lotteryCfg.beaconContractAddress);
  const tx = await lotteryTicketNftBeacon.update(lotteryTicketNftBlueprintV2.address);
  await awaitReceipt(tx, "Successfully updated Beacon's Blueprint Implementation.", "Failed to updat Beacon's Blueprint Implementation.");
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});