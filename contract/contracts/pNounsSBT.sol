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

contract pNounsSBT is ProviderSBT {
  using Strings for uint256;
  pNounsToken public pnouns; // pNounsNFT
  address public treasuryAddress; // トレジャリーウォレット

  constructor(
    IAssetProvider _assetProvider,
    pNounsToken _pnouns,
    address[] memory _administrators
  ) ProviderSBT(_assetProvider, 'pNouns SBT', 'pNouns', _administrators) {
    pnouns = _pnouns;
    description = 'This is the Memorial SBT of pNouns project (https://pnouns.wtf/).';
    mintPrice = 0.02 ether;
    mintLimit = 2100;
  }

  function mintPNouns(
    uint256[] calldata _tokenIds // ミントするTokenId
  ) external payable {
    // originチェック
    require(tx.origin == msg.sender, 'cannot mint from non-origin');

    // mintPriceが0の場合はセール停止中
    require(mintPrice > 0, "sale is closed");

    // ミント数に応じた ETHが送金されていること
    uint256 cost = mintPrice * _tokenIds.length;
    require(cost <= msg.value, 'insufficient funds');

    for (uint256 i = 0; i < _tokenIds.length; i++) {
      // pNounsNFTを保有していること
      require(msg.sender == pnouns.ownerOf(_tokenIds[i]), 'sender is not the owner of this token.');
      // ミント
      _safeMint(msg.sender, _tokenIds[i]);
    }
    nextTokenId += _tokenIds.length;
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

  function setPNounsToken(pNounsToken _pnouns) external onlyAdminOrOwner {
    pnouns = _pnouns;
  }

  function mint() public payable override returns (uint256) {
    revert('this function is not used');
  }

  function tokenName(uint256 _tokenId) internal view virtual override returns (string memory) {
    return string(abi.encodePacked('pNouns #', _tokenId.toString()));
  }
}
