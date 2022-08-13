# nft-lottery

Simple solution to NFT Lottery with smart contracts using Solidity and Hardhat Environment.

## Setup
1. `$ yarn`
2. Rename `.env.example` to `.env` and fill all environment variables.

## Run Tests
1. `$ npx hardhat test --network hardhat`

## Scripts
Note: The scripts should be run in the given order. For some scripts also data is needed to be added in: `./config/lottery.config.js`. 
1. `$ npx hardhat run scripts/deploy.js --network goerli` - It will print the `blueprintContractAddress`, `beaconContractAddress`, `factoryContractAddress`.
2. `$ npx hardhat run scripts/uploadNftData.js --network goerli` - Will upload the image and the metadata to [NFT Storage](https://nft.storage/). And will print you the `baseURI`.
3. `$ npx hardhat run scripts/deployBeaconProxy.js --network goerli` - Will deploy a BeaconProxy and will print the `proxyContractAddress`.
4. `$ npx hardhat run scripts/mintTicket.js --network goerli` - Will print the status if a Ticket NFT was minted.
5. `$ npx hardhat run scripts/drawWinners.js --network goerli` - Will draw the winners if the lottery has finished.
6. `$ npx hardhat run scripts/payWinners.js --network goerli` - Will pay the drawn winners if the lottery has finished.
(4 and 5 can be replaced with `$ npx hardhat run scripts/drawAndPayWinners.js --network goerli`)
7. `$ npx hardhat run scripts/updateBeacon.js --network goerli` - It will deploy and print the address for `LotteryTicketNftV2` and will update the beacon to point to the new address. 


