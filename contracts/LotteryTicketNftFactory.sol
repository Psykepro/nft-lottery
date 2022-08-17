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

    function createLotteryProxy(
        string memory _baseUri, 
        uint256 _ticketPrice, 
        uint256 _lotteryDurationInMinutes, 
        address _vrfCoordinator, 
        address _link, 
        bytes32 _keyHash, 
        uint256 _fee
    ) public returns (address deployed) {
        bytes32 salt = getSalt(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
        bytes memory bytecode = getBytecode(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
        deployed = Create2.deploy(0, salt, bytecode);
        proxyId += 1;
        lotteryTicketNftBeaconProxies.push(deployed);
        emit CreatedLotteryProxy(deployed, salt);
    }

    function predictAddressForLottery(
        string memory _baseUri, 
        uint256 _ticketPrice, 
        uint256 _lotteryDurationInMinutes, 
        address _vrfCoordinator, 
        address _link, 
        bytes32 _keyHash, 
        uint256 _fee
    ) public view returns (address predicted) {
        bytes32 salt = getSalt(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
        bytes memory bytecode = getBytecode(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
        predicted = computeAddress(salt, keccak256(bytecode));
    }

    function getImplementation() public view returns (address) {
        return beacon.implementation();
    }

    function getLatestLotteryProxy() public view returns (address) {
        return lotteryTicketNftBeaconProxies[lotteryTicketNftBeaconProxies.length - 1];
    }

    //////////////
    // Internal //
    //////////////

    function computeAddress(bytes32 salt, bytes32 codeHash) internal view returns (address) {
        return Create2.computeAddress(salt, codeHash);
    }

    function _getData(
        string memory _baseUri, 
        uint256 _ticketPrice, 
        uint256 _lotteryDurationInMinutes, 
        address _vrfCoordinator, 
        address _link, 
        bytes32 _keyHash, 
        uint256 _fee
    ) internal pure returns (bytes memory) {
        return abi.encodeWithSignature("initialize(string,uint256,uint256,address,address,bytes32,uint256)", _baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
    }

    function getBytecode(
        string memory _baseUri, 
        uint256 _ticketPrice, 
        uint256 _lotteryDurationInMinutes, 
        address _vrfCoordinator, 
        address _link, 
        bytes32 _keyHash, 
        uint256 _fee
    ) internal view returns (bytes memory) {
        bytes memory data = _getData(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee);
        return abi.encodePacked(type(BeaconProxy).creationCode, abi.encode(beacon, data));
    }

    function getSalt(
        string memory _baseUri, 
        uint256 _ticketPrice, 
        uint256 _lotteryDurationInMinutes, 
        address _vrfCoordinator, 
        address _link, 
        bytes32 _keyHash, 
        uint256 _fee
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(_baseUri, _ticketPrice, _lotteryDurationInMinutes, _vrfCoordinator, _link, _keyHash, _fee, proxyId));
    }
}