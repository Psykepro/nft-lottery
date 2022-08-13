// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract LotteryTicketNft is Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

  using CountersUpgradeable for CountersUpgradeable.Counter;
  using SafeMath for uint256;

  struct WinnerInfo {
    bool isPaid;
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

  // Events //
  event Mint(address owner);
  event WinnerDeclared(address winner);
  event WinnerPaid(address winner, uint256 amount);

  function initialize(
    string memory _baseUri,
    uint256 _ticketPrice,
    uint256 _lotteryDurationInMinutes
  ) initializer public {
      require(_ticketPrice > 0, "Value for 'ticketPrice' must be greater than 0");
      require(bytes(_baseUri).length > 0, "Value for 'baseURI' is empty.");
      require(_lotteryDurationInMinutes > 0, "Value for 'lotteryDurationInMinutes' must be greater than 0.");
      baseURI = _baseUri;
      ticketPrice = _ticketPrice;
      lotteryEndTimestamp = block.timestamp + _lotteryDurationInMinutes * 1 minutes;
      // The time after which if there is a mint transaction it will draw the surprise winner.
      surpriseWinnerStartDrawTimestamp = block.timestamp + (_lotteryDurationInMinutes / 2) * 1 minutes;
      __ERC721_init("LotteryTicket", "LTICKET");
      __ERC721URIStorage_init();
      __Ownable_init();
      __ReentrancyGuard_init();
      transferOwnership(tx.origin);
  }

  //////////////
  // External //
  //////////////

  function safeMint(address to) public payable mintCompliance(_msgSender()) nonReentrant {
      uint256 tokenId = _tokenIdCounter.current();
      entries.push(_msgSender());
      if (surpriseWinner.addr == address(0) && block.timestamp >= surpriseWinnerStartDrawTimestamp) {
        if(entries.length == 1) {
          surpriseWinner.addr = entries[0];
        } else {
          uint256 winner = _drawRandomWinner();
          surpriseWinner.addr = entries[winner];
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
      uint256 winner = _drawRandomWinner();
      surpriseWinner.addr = entries[winner];
      emit WinnerDeclared(surpriseWinner.addr);
    }

    if (finalWinner.addr == address(0)) {
      uint256 winner = _drawRandomWinner();
      if (entries[winner] == surpriseWinner.addr) {
          while (entries[winner] == surpriseWinner.addr) {
            winner = _drawRandomWinner();
          }
      }
      finalWinner.addr = entries[winner];
      emit WinnerDeclared(finalWinner.addr);
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

  function _drawRandomWinner() internal view returns(uint256) {
      uint256 randomNumber = random();
      return randomNumber.mod(entries.length);
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

  /////////////
  // Private //
  /////////////

  function random() private view returns(uint) {
    // This function is actually 'hackable' because it can be manipulated by the miners. 
    // But since ChainLink's 'VRFConsumerBase' is not Upgradeable it can't be used for this smart contract.
    return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _tokenIdCounter.current())));
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