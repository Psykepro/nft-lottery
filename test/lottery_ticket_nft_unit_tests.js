require("@nomiclabs/hardhat-waffle");
const { ethers, upgrades } = require("hardhat")
const { expect } = require("chai");
const { lotteryCfg } = require("../config/lottery.config");
const { DeployAllContracts } = require("../utils/deploy.js");
const { expectRevert, constants} = require('@openzeppelin/test-helpers');
const { awaitReceipt } = require("../utils/transactions");


async function deployBeaconProxy(factory, proxyParams) {
  let tx = await factory.createLottery(...proxyParams);
  await awaitReceipt(tx);
  let proxyAddress = await factory.getLatestProxy();
  return await ethers.getContractAt(
    "LotteryTicketNft",
    proxyAddress
  );
}

describe("LotteryTicketNft Unit Tests", () => {
  let blueprint;
  let beacon;
  let proxy;
  let deployer;
  let user2;
  let user3;
  let provider;
  let proxyParams;
  let factory;
  before(async () => {
    [deployer, user2, user3] = await ethers.getSigners();
    provider = ethers.getDefaultProvider();
    const contractAddresses = await DeployAllContracts(false);
    blueprint = await ethers.getContractFactory("LotteryTicketNft");
    beacon = await ethers.getContractAt(
      "LotteryTicketNftBeacon",
      contractAddresses.beacon
    );
    factory = await ethers.getContractAt(
      "LotteryTicketNftFactory",
      contractAddresses.factory
    );
    proxyParams = [lotteryCfg.baseURI, lotteryCfg.ticketPrice, lotteryCfg.lotteryDurationInMinutes];
    proxy = await deployBeaconProxy(factory, proxyParams);
  });

  describe("Minting", () => {
    it("Should be able to mint properly", async () => {
      await expect(proxy.connect(user2)
        .safeMint(user2.address, {value: lotteryCfg.ticketPrice}))
        .to.emit(proxy, "Mint").withArgs(user2.address)
        .not.to.be.reverted;
  
      expect(await proxy.balanceOf(user2.address)).to.be.equal(1);
      expect(await proxy.entries(0)).to.be.equal(user2.address);
      expect(await proxy.ownerOf(0)).to.be.equal(user2.address);
      expect(await proxy.entriesCount()).to.be.equal(1);
      expect(await proxy.prizePool()).to.be.equal(lotteryCfg.ticketPrice);
    });
  
    it("Should draw surprise winner if there is a mint transaction after the half of the lottery lifetime.", async () => {
      await ethers.provider.send("evm_mine", [(await proxy.surpriseWinnerStartDrawTimestamp()).toNumber()]);
  
      await expect(proxy.connect(user2)
        .safeMint(user2.address, {value: lotteryCfg.ticketPrice}))
        .to.emit(proxy, "Mint").withArgs(user2.address)
        .not.to.be.reverted; 
  
      let surpriseWinnerInfo = await proxy.surpriseWinner();
      expect(surpriseWinnerInfo.addr).not.to.be.equal(constants.ZERO_ADDRESS);
    });
  
    it("Should NOT participate if the sended funds are lower than the required.", async () => {
      await expectRevert(
        proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice.sub(1)}),
        "Insufficient funds!");
    });
  
    it("Should NOT participate if the lottery ended.", async () => {
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);
  
      await expectRevert(
        proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice}),
        "Lottery is already closed.");
    });
  });

  describe("Draw Winners", () => {
    before(async () => {
      proxy = await deployBeaconProxy(factory, proxyParams);
    });

    it("Only Deployer (Owner) should be able to draw winners", async () => {
      await expectRevert(proxy.connect(user2)
        .drawWinners(), 
        "Ownable: caller is not the owner");
    });

    it("Deployer Shouldn't be able to draw winners before the end of the lottery", async () => {
      await expectRevert(proxy.connect(deployer)
        .drawWinners(), 
        "The Lottery isn't finished yet.");
    });

    it("Deployer Shouldn't draw surprise winner if there is only 1 entry", async () => {
      await proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice});
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);
      
      await expect(proxy.connect(deployer)
        .drawWinners())
        .to.emit("WinnerDeclared")
        .to.be.ok;
    
        let surpriseWinnerInfo = await proxy.surpriseWinner();
        let finalWinnerInfo = await proxy.finalWinner();
        expect(surpriseWinnerInfo.addr).to.be.equal(constants.ZERO_ADDRESS);
        expect(finalWinnerInfo.addr).not.to.be.equal(constants.ZERO_ADDRESS);
    });

    it("Deployer Should be able to draw winner properly when the entry is only 1", async () => {
      await expect(proxy.connect(deployer)
        .drawWinners())
        .to.emit("WinnerDeclared")
        .not.to.be.reverted;
    
        let surpriseWinnerInfo = await proxy.surpriseWinner();
        let finalWinnerInfo = await proxy.finalWinner();
        expect(surpriseWinnerInfo.addr).to.be.equal(constants.ZERO_ADDRESS);
        expect(finalWinnerInfo.addr).not.to.be.equal(constants.ZERO_ADDRESS);
    });

    it("Deployer Should be able to draw winners properly when the entry are 2 or more", async () => {
      proxy = await deployBeaconProxy(factory, proxyParams);
      await proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice});
      await proxy.connect(user3).safeMint(user3.address, {value: lotteryCfg.ticketPrice});
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);

      await expect(proxy.connect(deployer)
        .drawWinners())
        .to.emit("WinnerDeclared")
        .to.emit("WinnerDeclared")
        .not.to.be.reverted;
    
        let surpriseWinnerInfo = await proxy.surpriseWinner();
        let finalWinnerInfo = await proxy.finalWinner();
        expect(surpriseWinnerInfo.addr).not.to.be.equal(constants.ZERO_ADDRESS);
        expect(finalWinnerInfo.addr).not.to.be.equal(constants.ZERO_ADDRESS);
    });
  })

  describe("Pay Winners", () => {
    before(async () => {
      proxy = await deployBeaconProxy(factory, proxyParams);
    });

    it("Only Deployer (Owner) should be able to pay winners", async () => {
      await expectRevert(proxy.connect(user2)
        .payWinners(), 
        "Ownable: caller is not the owner");
    });

    it("Deployer Shouldn't be able to pay winners before the end of the lottery", async () => {
      await expectRevert(proxy.connect(deployer)
        .payWinners(), 
        "The Lottery isn't finished yet.");
    });


    it("Deployer Shouldn't be able to pay winners if are no entries", async () => {
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);

      await expectRevert(proxy.connect(deployer)
        .payWinners(), 
        "There are no entries in the lottery.");
    });

    it("Deployer Shouldn't be able to pay winners if no winners are drawn", async () => {
      proxy = await deployBeaconProxy(factory, proxyParams);
      await proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice});
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);

      await expectRevert(proxy.connect(deployer)
        .payWinners(), 
        "The winners draw is still in progress.");
    });

    it("Deployer Should be able to pay when the entry is only 1", async () => {
      await expect(proxy.connect(deployer).drawWinners())
      let prizePool = await proxy.prizePool();
      let finalWinnerInfo = await proxy.finalWinner();
      let balanceBefore = await waffle.provider.getBalance(finalWinnerInfo.addr);;

      await expect(proxy.connect(deployer)
        .payWinners())
        .to.emit("WinnerPaid").withArgs(finalWinnerInfo.addr, prizePool)
        .not.to.be.reverted;
      
      let balanceAfter = await waffle.provider.getBalance(finalWinnerInfo.addr);
      finalWinnerInfo = await proxy.finalWinner();
      let surpriseWinnerInfo = await proxy.surpriseWinner();
      expect(surpriseWinnerInfo.isPaid).to.be.false;
      expect(finalWinnerInfo.isPaid).to.be.true;
      expect(balanceAfter.sub(balanceBefore)).to.be.equal(prizePool);
    });

    it("Deployer Should be able to pay when the entry are 2 or more", async () => {

      proxy = await deployBeaconProxy(factory, proxyParams);
      await proxy.connect(user2).safeMint(user2.address, {value: lotteryCfg.ticketPrice});
      await proxy.connect(user3).safeMint(user3.address, {value: lotteryCfg.ticketPrice});
      await ethers.provider.send("evm_mine", [(await proxy.lotteryEndTimestamp()).toNumber()]);

      await expect(proxy.connect(deployer).drawWinners())
      let prizePool = await proxy.prizePool();
      let surpriseWinnerInfo = await proxy.surpriseWinner();
      let finalWinnerInfo = await proxy.finalWinner();
      let surpriseWinnerBalanceBefore = await waffle.provider.getBalance(surpriseWinnerInfo.addr);
      let finalWinnerBalanceBefore = await waffle.provider.getBalance(finalWinnerInfo.addr);

      await expect(proxy.connect(deployer)
        .payWinners())
        .to.emit("WinnerPaid").withArgs(finalWinnerInfo.addr, prizePool)
        .not.to.be.reverted;
      
      let surpriseWinnerBalanceAfter = await waffle.provider.getBalance(surpriseWinnerInfo.addr);
      let finalWinnerBalanceAfter = await waffle.provider.getBalance(finalWinnerInfo.addr);
      finalWinnerInfo = await proxy.finalWinner();
      surpriseWinnerInfo = await proxy.surpriseWinner();
      expect(surpriseWinnerInfo.isPaid).to.be.true;
      expect(finalWinnerInfo.isPaid).to.be.true;
      expect(surpriseWinnerBalanceAfter.sub(surpriseWinnerBalanceBefore)).to.be.equal(prizePool/2);
      expect(finalWinnerBalanceAfter.sub(finalWinnerBalanceBefore)).to.be.equal(prizePool/2);
    });
  });
});
