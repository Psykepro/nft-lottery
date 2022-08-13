// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./LotteryTicketNftBeacon.sol";
import "./LotteryTicketNft.sol";

contract LotteryTicketNftFactory {
    LotteryTicketNftBeacon immutable public beacon;
    address public blueprintImplementation;
    address[] public lotteryTicketNftBeaconProxies;
    uint public proxyId;
    
    event CreatedLotteryProxy(address addr, bytes32 salt);

    constructor(address _blueprintImplementation) {
        blueprintImplementation = _blueprintImplementation;
        beacon = new LotteryTicketNftBeacon(_blueprintImplementation);
    }

    ////////////
    // Public //
    ////////////

    function createLottery(string memory _baseUri, uint256 _ticketPrice, uint256 _lotteryDurationInMinutes) public returns (address deployed) {
        bytes32 salt = getSalt(_baseUri, _ticketPrice, _lotteryDurationInMinutes);
        bytes memory bytecode = getBytecode(_baseUri, _ticketPrice, _lotteryDurationInMinutes);
        deployed = Create2.deploy(0, salt, bytecode);
        proxyId += 1;
        lotteryTicketNftBeaconProxies.push(deployed);
        emit CreatedLotteryProxy(deployed, salt);
    }

    function predictAddressForLottery(string memory _baseUri, uint256 _ticketPrice, uint256 _lotteryDurationInMinutes) public view returns (address predicted) {
        bytes32 salt = getSalt(_baseUri, _ticketPrice, _lotteryDurationInMinutes);
        bytes memory bytecode = getBytecode(_baseUri, _ticketPrice, _lotteryDurationInMinutes);
        predicted = computeAddress(salt, keccak256(bytecode));
    }

    function getImplementation() public view returns (address) {
        return beacon.implementation();
    }

    function getLatestProxy() public view returns (address) {
        return lotteryTicketNftBeaconProxies[lotteryTicketNftBeaconProxies.length - 1];
    }

    //////////////
    // Internal //
    //////////////

    function computeAddress(bytes32 salt, bytes32 codeHash) internal view returns (address) {
        return Create2.computeAddress(salt, codeHash);
    }

    function _getData(string memory _baseUri, uint256 _ticketPrice, uint256 _lotteryDurationInMinutes) internal pure returns (bytes memory) {
        return abi.encodeWithSignature("initialize(string,uint256,uint256)", _baseUri, _ticketPrice, _lotteryDurationInMinutes);
    }

    function getBytecode(string memory _baseUri, uint256 _ticketPrice, uint256 _lotteryDurationInMinutes) internal view returns (bytes memory) {
        bytes memory data = _getData(_baseUri, _ticketPrice, _lotteryDurationInMinutes);
        return abi.encodePacked(type(BeaconProxy).creationCode, abi.encode(beacon, data));
    }

    function getSalt(string memory _baseUri, uint256 _ticketPrice, uint256 _lotteryDurationInMinutes) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(_baseUri, _ticketPrice, _lotteryDurationInMinutes, proxyId));
    }
}