// SPDX-License-Identifier: MIT

/*
 * Created by Eiba (@eiba8884)
 */
/*********************************
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░██████░░░████████░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 *********************************/

pragma solidity ^0.8.6;

import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import './pNounsContractFilter2.sol';
import './imageParts/interfaces/ISnapshotStore.sol';

import { NounsToken } from './external/nouns/NounsToken.sol';

contract PNounsPoapToken is pNounsContractFilter2 {
  using Strings for uint256;

  // address public treasuryAddress = 0x8d2B28265bEE1C926433A25D951adb03De9Ab275; // pNounsNFTウォレット
  address public treasuryAddress = 0x52A76a606AC925f7113B4CC8605Fe6bCad431EbB; // 開発ウォレット
  mapping(address => uint256) public mintCount; // アドレスごとのミント数

  NounsToken public nounsToken;
  ISnapshotStore public immutable snapshotStore;

  constructor(
    IAssetProvider _assetProvider,
    ISnapshotStore _snapshotStore,
    NounsToken _nounsToken,
    address[] memory _administrators
  ) pNounsContractFilter2(_assetProvider, 'pNouns Voting POAP', 'pNouns POAP', _administrators) {
    description = 'This is the POAP of the pNouns Voting.';
    snapshotStore = _snapshotStore;
    nounsToken = _nounsToken;
    _setDefaultRoyalty(payable(treasuryAddress), 1000);
  }

  function startMint() public onlyAdminOrOwner {
    // poapはtokenid=1からスタートするため、nounsTokenのtokenId=0をmintしておく
    nounsToken.mint();
  }

  function adminMint(
    address[] memory _to,
    uint256[] memory _vp,
    ISnapshotStore.Snapshot memory _snapshot
  ) public onlyAdminOrOwner {
    uint256 snapshotIndex = snapshotStore.register(_snapshot);

    require(_to.length == _vp.length, "invalid array num.");

    // ミント処理
    for (uint256 i = 0; i < _to.length; i++) {
      _safeMint(_to[i], 1);
      nounsToken.mint();
      mintCount[_to[i]]++;
      snapshotStore.setSnapshot(nextTokenId + 1, snapshotIndex, _vp[i]);
      nextTokenId++;
    }
  }

  function withdraw() external payable onlyAdminOrOwner {
    require(treasuryAddress != address(0), "treasuryAddress shouldn't be 0");
    (bool sent, ) = payable(treasuryAddress).call{ value: address(this).balance }('');
    require(sent, 'failed to move fund to treasuryAddress contract');
  }

  function setTreasuryAddress(address _treasury) external onlyAdminOrOwner {
    treasuryAddress = _treasury;
  }

  function setNounsToken(NounsToken _nounsToken) external onlyAdminOrOwner {
    nounsToken = _nounsToken;
  }

  function mint() public payable override returns (uint256) {
    revert('this function is not used');
  }

  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }

  function tokenName(uint256 _tokenId) internal view virtual override returns (string memory) {
    return string(abi.encodePacked('POAP ', _tokenId.toString()));
  }

  // 10% royalties for treasuryAddressß
  function _processRoyalty(uint256 _salesPrice, uint256) internal virtual override returns (uint256 royalty) {
    royalty = (_salesPrice * 100) / 1000; // 10.0%
    address payable payableTo = payable(treasuryAddress);
    payableTo.transfer(royalty);
  }
}
