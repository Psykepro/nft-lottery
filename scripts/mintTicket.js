const { lotteryCfg } = require("../config/lottery.config")
const { awaitReceipt } = require("../utils/transactions")

async function main(contractAddress) {
  const LotteryTicketNft = await ethers.getContractFactory("LotteryTicketNft")
  const lotteryTicketNft = await LotteryTicketNft.attach(contractAddress)
  const [owner] = await ethers.getSigners()
  lotteryTicketNft.on("Mint", (addr) => {
    console.log("[event:Mint]: addr: %s", addr);
  });
  const tx = await lotteryTicketNft.safeMint(owner.address, {value: lotteryCfg.ticketPrice});
  await awaitReceipt(tx, ("NFT minted to: " + owner.address), ("Failed to mint NFT for: " + owner.address));
}

main(lotteryCfg.proxyContractAddress)
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});