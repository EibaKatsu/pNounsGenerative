pragma solidity ^0.8.6;

import '../interfaces/ISnapshotStore.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

contract SnapshotStore is ISnapshotStore, Ownable {
  uint256 private nextPartIndex = 1;
  uint256 private latestBlockNumber = 0;
  mapping(uint256 => Snapshot) private partsList;
  mapping(uint256 => uint256) private tokenIdToSnapshot;
  mapping(uint256 => uint256) private tokenIdToVp;

  address public minter ;

  ////////// modifiers //////////
  modifier onlyMinterOrOwner() {
    require(owner() == _msgSender() || minter == _msgSender(), "Not owner or minter");
    _;
  }

  function register(Snapshot memory _snapshot) external onlyMinterOrOwner returns (uint256) {
    if (latestBlockNumber < _snapshot.end) {
      latestBlockNumber = _snapshot.end;
    }
    partsList[nextPartIndex] = _snapshot;
    nextPartIndex++;
    return nextPartIndex - 1;
  }

  function currentBlockNumber() external view returns (uint256) {
    return latestBlockNumber;
  }

  function setCurrentBlockNumber(uint256 _blockNumber) external onlyOwner {
    latestBlockNumber = _blockNumber;
  }

  function setMinter(address _minter) external onlyOwner {
    minter = _minter;
  }
  function setSnapshot(uint256 tokenId, uint256 snapshotId, uint256 vp) external onlyMinterOrOwner {
    tokenIdToSnapshot[tokenId] = snapshotId;
    tokenIdToVp[tokenId] = vp;
  }

  function getSnapshot(uint256 index) external view returns (Snapshot memory output) {
    output = partsList[tokenIdToSnapshot[index]];
  }

  function getTitle(uint256 index) external view returns (string memory output) {
    output = partsList[tokenIdToSnapshot[index]].title;
  }

  function getVp(uint256 index) external view returns (uint256 vp) {
    vp = tokenIdToVp[index];
  }
}
