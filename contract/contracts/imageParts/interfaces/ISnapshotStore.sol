// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface ISnapshotStore {
  struct Snapshot {
    string id;
    string title;
    string choices;
    string scores;
    uint256 start;
    uint256 end;
  }

  function register(Snapshot memory snapshot) external returns (uint256);

  function currentBlockNumber() external returns (uint256);

  function setSnapshot(uint256 tokenId, uint256 snapshotId, uint256 vp) external;

  function getSnapshot(uint256 index) external view returns (Snapshot memory output);

  function getTitle(uint256 index) external view returns (string memory output);

  function getVp(uint256 index) external view returns (uint256 vp);
}
