
const { linkConfig } = require("../config/link.config");
const { HardhatChainId } = require("../constants/hardhat");


async function DeployLotteryContracts(printAddresses=true) {
  const LotteryTicketNftBlueprint = await ethers.getContractFactory("LotteryTicketNft");
  const lotteryTicketNftBlueprint = await LotteryTicketNftBlueprint.deploy();
  await lotteryTicketNftBlueprint.deployed();
  if (printAddresses)
    console.log(`LotteryTicketNft (Blueprint) deployed at address: ${lotteryTicketNftBlueprint.address}`);

  const LotteryTicketNftFactory = await ethers.getContractFactory("LotteryTicketNftFactory");
  const lotteryTicketNftFactory = await LotteryTicketNftFactory.deploy(lotteryTicketNftBlueprint.address);
  await lotteryTicketNftFactory.deployed();

  const beaconAddress = await lotteryTicketNftFactory.beacon();
  const LotteryTicketNftBeacon = await ethers.getContractFactory("LotteryTicketNftBeacon");
  const lotteryTicketNftBeacon =  await LotteryTicketNftBeacon.attach(beaconAddress);
  if (printAddresses) {
    console.log(`LotteryTicketNftBeacon deployed at address: ${beaconAddress}`);
    console.log(`LotteryTicketNftFactory deployed at address: ${lotteryTicketNftFactory.address}`);
  }

  return {
    blueprint: lotteryTicketNftBlueprint,
    beacon: lotteryTicketNftBeacon,
    factory: lotteryTicketNftFactory
  };
}


async function DeployChainlinkContracts(chainId, printInfo=true) {
  let linkToken;
  let linkTokenAddress;
  let VRFCoordinatorMock;
  let vrfCoordinatorAddress;
  let additionalMessage = "";
  const linkTokenFactory = await ethers.getContractFactory("LinkToken");
  const VRFCoordinatorMockFactory = await ethers.getContractFactory("VRFCoordinatorMock");

  if (chainId == HardhatChainId) {
    console.log("Local Network Detected, Deploying Mocks");

    linkToken = await linkTokenFactory.deploy();
    await linkToken.deployed();
    if (printInfo)
      console.log(`LinkToken deployed at address: ${linkToken.address}`);
    VRFCoordinatorMock = await VRFCoordinatorMockFactory.deploy(linkToken.address);
    await VRFCoordinatorMock.deployed();
    if (printInfo)
      console.log(`VRFCoordinatorMock deployed at address: ${VRFCoordinatorMock.address}`);
    
    linkTokenAddress = linkToken.address;
    vrfCoordinatorAddress = VRFCoordinatorMock.address;
    additionalMessage =
      " --linkaddress " +
      linkTokenAddress +
      " --fundadmount " +
      linkConfig[chainId].fundAmount;
  } else {
    linkTokenAddress = linkConfig[chainId].linkToken;
    vrfCoordinatorAddress = linkConfig[chainId].vrfCoordinator;
    linkToken = await linkTokenFactory.attach(linkTokenAddress);
    VRFCoordinatorMock = await VRFCoordinatorMockFactory.attach(vrfCoordinatorAddress);
  }

  const keyHash = linkConfig[chainId].keyHash;
  const fee = linkConfig[chainId].fee;

  return {
    networkName: linkConfig[chainId].name,
    linkToken: linkToken,
    VRFCoordinatorMock: VRFCoordinatorMock,
    keyHash: keyHash,
    fee: fee
  }
}

module.exports = {
  DeployLotteryContracts,
  DeployChainlinkContracts
}