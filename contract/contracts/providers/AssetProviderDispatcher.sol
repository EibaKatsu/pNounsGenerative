// SPDX-License-Identifier: MIT

/**
 * Created by eiba8884
 */

pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/interfaces/IERC165.sol';
import '../packages/assetProvider/IAssetProvider.sol';
import '../packages/graphics/SVG.sol';

contract AssetProviderDispatcher is IAssetProviderEx, IERC165, Ownable {
  using SVG for SVG.Element;
  struct providerIndex {
    uint256 assetIndex;
    IAssetProviderEx provider;
    bool isSet;
  }

  mapping(uint256 => providerIndex) public assetProviders; // set AssetProvider for tokenId
  uint8 public providerCount;

  constructor(IAssetProviderEx firstProvider) {
    assetProviders[0] = providerIndex(0, firstProvider, true);
    providerCount++;
  }

  function addProviderIndex(uint256 _index, IAssetProviderEx _provider) external onlyOwner {
    require(assetProviders[providerCount].assetIndex < _index, 'Cannot be less than the maximum registered index');
    assetProviders[providerCount] = providerIndex(_index, _provider, true);
    providerCount++;
  }

  function deleteProviderIndex(uint8 i) external onlyOwner {
    require(assetProviders[i].isSet, '_index is not exists');
    delete assetProviders[i];
    providerCount--;
  }

  /**
   * Get AssetProvider for assetId
   */
  function _provider(uint256 _assetId) private view returns (IAssetProviderEx provider) {
    for (uint8 i = providerCount - 1; i == 0; i--) {
      if (assetProviders[i].isSet && assetProviders[i].assetIndex <= _assetId) {
        provider = assetProviders[i].provider;
        break;
      }
    }
  }

  function getProviderInfo() external view override returns (ProviderInfo memory) {
    return ProviderInfo('pnouns', 'pNouns', this);
  }

  /**
   * This function returns SVGPart and the tag. The SVGPart consists of one or more SVG elements.
   * The tag specifies the identifier of the SVG element to be displayed (using <use> tag).
   * The tag is the combination of the provider key and assetId (e.e., "asset123")
   */
  function generateSVGPart(uint256 _assetId) external view returns (string memory svgPart, string memory tag) {
    return _provider(_assetId).generateSVGPart(_assetId);
  }

  /**
   * This is an optional function, which returns various traits of the image for ERC721 token.
   * Format: {"trait_type":"TRAIL_TYPE","value":"VALUE"},{...}
   */
  function generateTraits(uint256 _assetId) external view returns (string memory) {
    return _provider(_assetId).generateTraits(_assetId);
  }

  /**
   * This function returns the number of assets available from this provider.
   * If the total supply is 100, assetIds of available assets are 0,1,...99.
   * The generative providers may returns 0, which indicates the provider dynamically but
   * deterministically generates assets using the given assetId as the random seed.
   */
  function totalSupply() external view returns (uint256) {
    return 0;
  }

  /**
   * Returns the onwer. The registration update is possible only if both contracts have the same owner.
   */
  function getOwner() external view returns (address) {
    return owner();
  }

  /**
   * This function processes the royalty payment from the decentralized autonomous marketplace.
   */
  function processPayout(uint256 _assetId) external payable {
    address payable payableTo = payable(owner());
    payableTo.transfer(msg.value);
    emit Payout('pnouns', _assetId, payableTo, msg.value);
  }

  function generateSVGDocument(uint256 _assetId) external view returns (string memory document) {
    string memory svgPart;
    string memory tag;
    (svgPart, tag) = _provider(_assetId).generateSVGPart(_assetId);
    document = SVG.document('0 0 1024 1024', bytes(svgPart), SVG.use(tag).svg());
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return
      interfaceId == type(IAssetProvider).interfaceId ||
      interfaceId == type(IAssetProviderEx).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }
}
