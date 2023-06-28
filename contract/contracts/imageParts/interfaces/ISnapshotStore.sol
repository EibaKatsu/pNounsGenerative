// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface ISnapshotStore {
  struct Snapshot {
    string id;
    string title;
    uint256 start;
    uint256 end;
  }
  struct Box {
    uint256 w;
    uint256 h;
  }

  function register(Snapshot memory snapshot) external returns (uint256);

  function currentBlockNumber() external returns (uint256);

  function setSnapshot(uint256 tokenId, uint256 snapshotId) external;

  function getTitle(uint256 index) external view returns (string memory output);
}
