pragma solidity ^0.8.6;

import '../interfaces/ISnapshotStore.sol';

contract SnapshotStore is ISnapshotStore {
  uint256 private nextPartIndex = 1;
  uint256 private constant startBlockNumber = 1685707200;
  mapping(uint256 => Snapshot) private partsList;
  mapping(uint256 => uint256) private tokenIdToSnapshot;
  mapping(uint256 => uint256) private tokenIdToVp;

  function register(Snapshot memory _snapshot) external returns (uint256) {
    partsList[nextPartIndex] = _snapshot;
    nextPartIndex++;
    return nextPartIndex - 1;
  }

  function currentBlockNumber() external view returns (uint256) {
    if (nextPartIndex == 1) {
      return startBlockNumber;
    } else {
      return partsList[nextPartIndex - 1].end;
    }
  }

  function setSnapshot(uint256 tokenId, uint256 snapshotId, uint256 vp) external {
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
