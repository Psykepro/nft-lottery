// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./external/VRFConsumerBaseUpgradeable.sol";

contract LotteryTicketNftV2 is Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, VRFConsumerBaseUpgradeable {

  using CountersUpgradeable for CountersUpgradeable.Counter;
  using SafeMath for uint256;

  struct WinnerInfo {
    bool isPaid;
    bytes32 randomnessRequestId;
    address addr;
  }

  string baseURI;
  address[] public entries;
  uint256 public ticketPrice;
  uint256 public lotteryEndTimestamp;
  uint256 public surpriseWinnerStartDrawTimestamp;
  WinnerInfo public surpriseWinner;
  WinnerInfo public finalWinner;
  uint256 public prizePool;
  CountersUpgradeable.Counter private _tokenIdCounter;
  string public baseURISuffix = "/metadata.json"; 
  bytes32 private keyHash;
  uint256 private fee;
  mapping(bytes32 => WinnerInfo) public winnerRandomnessRequests;

  // Events //
  event Mint(address owner);
  event WinnerDeclared(address winner);
  event WinnerPaid(address winner, uint256 amount);
  event RandomnessRequested(bytes32 requestId);

  function initialize(
    string memory _baseUri,
    uint256 _ticketPrice,
    uint256 _lotteryDurationInMinutes,
    address _vrfCoordinator,
    address _link,
    bytes32 _keyHash,
    uint256 _fee
  ) initializer public {
      require(_ticketPrice > 0, "Value for 'ticketPrice' must be greater than 0");
      require(bytes(_baseUri).length > 0, "Value for 'baseURI' is empty.");
      require(_lotteryDurationInMinutes > 60, "Value for 'lotteryDurationInMinutes' must be greater than 60."); // V2 Change
      baseURI = _baseUri;
      ticketPrice = _ticketPrice;
      lotteryEndTimestamp = block.timestamp + _lotteryDurationInMinutes * 1 minutes;
      // The time after which if there is a mint transaction it will draw the surprise winner.
      surpriseWinnerStartDrawTimestamp = block.timestamp + (_lotteryDurationInMinutes / 2) * 1 minutes;
      keyHash = _keyHash;
      fee = _fee;
      __ERC721_init("LotteryTicket", "LTICKET");
      __ERC721URIStorage_init();
      __Ownable_init();
      __ReentrancyGuard_init();
      __VRFConsumerBase_init(_vrfCoordinator, _link);
      transferOwnership(tx.origin);
  }

  //////////////
  // External //
  //////////////

  function safeMint(address to) public payable mintCompliance(_msgSender()) nonReentrant {
      uint256 tokenId = _tokenIdCounter.current();
      entries.push(_msgSender());
      if (surpriseWinner.addr == address(0) && block.timestamp >= surpriseWinnerStartDrawTimestamp) {
        if(entries.length > 1) {
          _requestRandomWinner(surpriseWinner);
        }
      }
      _tokenIdCounter.increment();
      prizePool += msg.value;
      _safeMint(to, tokenId);
      _setTokenURI(tokenId, string(abi.encodePacked(baseURI, baseURISuffix)));
      
      emit Mint(_msgSender());
  }

  ////////////
  // Public //
  ////////////

  function drawAndPayWinners() public onlyOwner nonReentrant afterLotteryIsFinished {
    if (surpriseWinner.addr == address(0) || finalWinner.addr == address(0)) {
      drawWinners();
    }
    payWinners();
  }

  function drawWinners() public onlyOwner nonReentrant afterLotteryIsFinished {
    require(surpriseWinner.addr == address(0) || finalWinner.addr == address(0), "All winners are already drawn.");

    if(entries.length == 1) {
        finalWinner.addr = entries[0];
        emit WinnerDeclared(finalWinner.addr);
        return;
    }

    if(entries.length == 2) {
        surpriseWinner.addr = entries[0];
        finalWinner.addr = entries[1];
        emit WinnerDeclared(finalWinner.addr);
        emit WinnerDeclared(surpriseWinner.addr);
        return;
    }

    if (surpriseWinner.addr == address(0)) {
      _requestRandomWinner(surpriseWinner);
    }

    if (finalWinner.addr == address(0)) {
      _requestRandomWinner(finalWinner);
    }
  }

  function payWinners() public onlyOwner nonReentrant afterLotteryIsFinished {
    require(entries.length > 0, "There are no entries in the lottery.");
    require(finalWinner.addr != address(0), "The winners draw is still in progress.");

    if (entries.length > 1) {
      require(surpriseWinner.addr != address(0), "The winners draw is still in progress.");
    }
    require(!finalWinner.isPaid || !surpriseWinner.isPaid, "All winners got paid already");
    uint256 totalAmount = address(this).balance;
    if (entries.length == 1) {
      finalWinner.isPaid = true;
      (bool success, ) = finalWinner.addr.call{value: totalAmount}("");
      require(success, "Transfer for final winner failed.");
      emit WinnerPaid(finalWinner.addr, totalAmount);
      return;
    }

    uint256 surpriseWinnerAmount = totalAmount / 2;
    uint256 finalWinnerAmount = totalAmount - surpriseWinnerAmount;
    if (!surpriseWinner.isPaid) {
      surpriseWinner.isPaid = true;
      (bool success, ) = surpriseWinner.addr.call{value: surpriseWinnerAmount}("");
      require(success, "Transfer for surprise winner failed.");
      emit WinnerPaid(surpriseWinner.addr, surpriseWinnerAmount);
    }

    if (!finalWinner.isPaid) {
      finalWinner.isPaid = true;
      (bool success, ) = finalWinner.addr.call{value: finalWinnerAmount}("");
      require(success, "Transfer for final winner failed.");
      emit WinnerPaid(finalWinner.addr, finalWinnerAmount);
    }
  }

  function entriesCount() public view returns (uint256) {
    return entries.length;
  }

  //////////////
  // Internal //
  //////////////

  function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
    WinnerInfo storage winnerInfo = winnerRandomnessRequests[requestId];
    uint256 winner = randomness.mod(entries.length);
    winnerInfo.addr = entries[winner];
    delete winnerRandomnessRequests[requestId];
    emit WinnerDeclared(winnerInfo.addr);
  }

  function _requestRandomWinner(WinnerInfo storage winnerInfo) internal {
      require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
      bytes32 requestId = requestRandomness(keyHash, fee);
      winnerRandomnessRequests[requestId] = winnerInfo;
      winnerInfo.randomnessRequestId = requestId;
      emit RandomnessRequested(requestId);
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721Upgradeable) {
      super._beforeTokenTransfer(from, to, tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
      super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
      return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable) returns (bool) {
      return super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view override  returns (string memory) {
      return baseURI;
  }

  ///////////////
  // Modifiers //
  ///////////////

  modifier mintCompliance(address _payer) {
    require(block.timestamp < lotteryEndTimestamp, "Lottery is already closed.");
    require(msg.value >= ticketPrice, "Insufficient funds!");
    _;
  }

  modifier afterLotteryIsFinished() {
    require(block.timestamp >= lotteryEndTimestamp, "The Lottery isn't finished yet.");
    _;
  }

}