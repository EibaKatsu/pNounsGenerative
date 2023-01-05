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
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './libs/ProviderSBT.sol';
import './pNounsToken.sol';

contract pNounsSBT556 is ProviderSBT {
  using Strings for uint256;
  address public treasuryAddress; // トレジャリーウォレット

  constructor(IAssetProvider _assetProvider, address[] memory _administrators)
    ProviderSBT(_assetProvider, 'pNouns SBT', 'pNouns', _administrators)
  {
    description = 'This is the Memorial SBT of Winning bid Noun 556 (https://pnouns.wtf/).';
    mintPrice = 0.02 ether;
    // mintLimit = 2100;  Limitを設定しない
  }

  function mintPNouns() external payable {
    // originチェック
    require(tx.origin == msg.sender, 'cannot mint from non-origin');

    // mintPriceが0の場合はセール停止中
    require(mintPrice > 0, 'sale is closed');

    // ETHが送金されていること
    require(mintPrice <= msg.value, 'insufficient funds');

    nextTokenId++;
    // ミント
    _safeMint(msg.sender, nextTokenId);
  }

  function withdraw() external payable onlyAdminOrOwner {
    require(treasuryAddress != address(0), "treasuryAddress shouldn't be 0");
    (bool sent, ) = payable(treasuryAddress).call{ value: address(this).balance }('');
    require(sent, 'failed to move fund to treasuryAddress contract');
  }

  /* treasuryAddress は non-upgradable */
  function setTreasuryAddress(address _treasury) external onlyAdminOrOwner {
    treasuryAddress = _treasury;
  }

  function mint() public payable override returns (uint256) {
    revert('this function is not used');
  }

  function tokenName(uint256 _tokenId) internal view virtual override returns (string memory) {
    return string(abi.encodePacked('pNouns #', _tokenId.toString()));
  }
}
