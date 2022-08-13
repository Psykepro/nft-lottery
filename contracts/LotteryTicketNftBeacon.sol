// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LotteryTicketNftBeacon is Ownable {
    UpgradeableBeacon immutable beacon;
    address public blueprint;

    constructor(address _blueprintImplementation) {
        beacon = new UpgradeableBeacon(_blueprintImplementation);
        blueprint = _blueprintImplementation;
        transferOwnership(tx.origin);
    }

    function update(address _newBlueprint) public onlyOwner {
        beacon.upgradeTo(_newBlueprint);
        blueprint = _newBlueprint;
    }

    function implementation() public view returns (address){
        return beacon.implementation();
    }
}