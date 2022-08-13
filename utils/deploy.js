async function DeployAllContracts(printAddresses=true) {
  const LotteryTicketNftBlueprint = await ethers.getContractFactory("LotteryTicketNft");
  const lotteryTicketNftBlueprint = await LotteryTicketNftBlueprint.deploy();
  await lotteryTicketNftBlueprint.deployed();
  if (printAddresses)
    console.log(`LotteryTicketNft (Blueprint) deployed at address: ${lotteryTicketNftBlueprint.address}`);

  const LotteryTicketNftFactory = await ethers.getContractFactory("LotteryTicketNftFactory");
  const lotteryTicketNftFactory = await LotteryTicketNftFactory.deploy(lotteryTicketNftBlueprint.address);
  await lotteryTicketNftFactory.deployed();
  const beaconAddress = await lotteryTicketNftFactory.beacon();
  if (printAddresses) {
    console.log(`LotteryTicketNftBeacon deployed at address: ${beaconAddress}`);
    console.log(`LotteryTicketNftFactory deployed at address: ${lotteryTicketNftFactory.address}`);
  }

  return {
    blueprint: lotteryTicketNftBlueprint.address,
    beacon: beaconAddress,
    factory: lotteryTicketNftFactory.address
  };
}

module.exports = {
  DeployAllContracts
}