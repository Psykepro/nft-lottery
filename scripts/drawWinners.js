const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")

async function main(contractAddress) {
  const LotteryTicketNft = await ethers.getContractFactory("LotteryTicketNft")
  const lotteryTicketNft = await LotteryTicketNft.attach(contractAddress)
  lotteryTicketNft.on("WinnerDeclared", (addr) => {
    console.log("[event:WinnerDeclared]: addr: %s", addr);
  });
  const tx = await lotteryTicketNft.drawWinners();
  await awaitReceipt(tx, "Winners drawn and paid successfully!", `Failed to draw and pay winners.`);
}

main(lotteryCfg.proxyContractAddress)
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});