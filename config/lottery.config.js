const { ethers, BigNumber } = require("ethers");

const priceAsStr = "0.001";
const baseURI = "ipfs://${NFT_STORAGE_URI}";
const lotteryCfg = {
  ticketPriceAsStr: priceAsStr,
  ticketPrice: ethers.utils.parseUnits(priceAsStr, 18),
  lotteryDurationInMinutes: BigNumber.from("60"),
  baseURI: baseURI,
  blueprintContractAddress: "",
  beaconContractAddress: "",
  factoryContractAddress: "",
  proxyContractAddress: "",
  
};

module.exports = {
  lotteryCfg,
};