const { DeployLotteryContracts, DeployChainlinkContracts } = require("../utils/deploy.js");

require("dotenv").config();


async function main() {

  const chainId = process.env.CHAIN_ID;
  await DeployChainlinkContracts(chainId)
  await DeployLotteryContracts();
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});


