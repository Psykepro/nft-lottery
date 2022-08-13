const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")

async function main(contractAddress) {
  const LotteryTicketNft = await ethers.getContractFactory("LotteryTicketNft")
  const lotteryTicketNft = await LotteryTicketNft.attach(contractAddress)
  lotteryTicketNft.on("WinnerDeclared", (addr) => {
    console.log("[event:WinnerDeclared]: addr: %s", addr);
  });
  lotteryTicketNft.on("WinnerPaid", (addr, amount) => {
    console.log(`[event:WinnerPaid]: address: ${addr}, amount: ${amount}`);
  });
  const tx = await lotteryTicketNft.drawAndPayWinners();
  await awaitReceipt(tx, "Winners drawn and paid successfully!", `Failed to draw and pay winners.`);
}

main(lotteryCfg.proxyContractAddress)
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});