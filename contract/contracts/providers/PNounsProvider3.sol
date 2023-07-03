// SPDX-License-Identifier: MIT

/**
 *
 * Created by @eiba8884
 */

pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import './NounsAssetProviderV2.sol';
import 'randomizer.sol/Randomizer.sol';
import '@openzeppelin/contracts/interfaces/IERC165.sol';
import '../packages/graphics/Path.sol';
import '../packages/graphics/SVG.sol';
import '../packages/graphics/Text.sol';
import '../packages/graphics/IFontProvider.sol';

import { NounsToken } from '../external/nouns/NounsToken.sol';
import '../imageParts/interfaces/ISnapshotStore.sol';

contract PNounsProvider3 is IAssetProviderEx, Ownable, IERC165 {
  using Strings for uint256;
  using Randomizer for Randomizer.Seed;
  using Vector for Vector.Struct;
  using Path for uint[];
  using SVG for SVG.Element;
  using TX for string;
  using Trigonometry for uint;

  INounsSeeder.Seed public seedFor000 =
    INounsSeeder.Seed({ background: 0, body: 14, accessory: 132, head: 94, glasses: 18 });
  INounsSeeder.Seed public seedFor553 =
    INounsSeeder.Seed({ background: 1, body: 28, accessory: 47, head: 48, glasses: 16 });
  INounsSeeder.Seed public seedFor556 =
    INounsSeeder.Seed({ background: 1, body: 7, accessory: 37, head: 238, glasses: 12 });
  IFontProvider public immutable font;
  NounsAssetProviderV2 public immutable nounsProvider;
  ISnapshotStore public immutable snapshotStore;

  NounsToken public nounsToken;
  uint256 seriesTextCount;

  constructor(
    IFontProvider _font,
    NounsAssetProviderV2 _nounsProvider,
    ISnapshotStore _snapshotStore,
    NounsToken _nounsToken
  ) {
    font = _font;
    nounsProvider = _nounsProvider;
    snapshotStore = _snapshotStore;
    nounsToken = _nounsToken;
  }

  function setNounsToken(NounsToken _nounsToken) external onlyOwner {
    nounsToken = _nounsToken;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return
      interfaceId == type(IAssetProvider).interfaceId ||
      interfaceId == type(IAssetProviderEx).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }

  function getOwner() external view override returns (address) {
    return owner();
  }

  function getProviderInfo() external view override returns (ProviderInfo memory) {
    return ProviderInfo('pnouns', 'pNouns', this);
  }

  function totalSupply() external pure override returns (uint256) {
    return 0;
  }

  function processPayout(uint256 _assetId) external payable override {
    address payable payableTo = payable(owner());
    payableTo.transfer(msg.value);
    emit Payout('pnouns', _assetId, payableTo, msg.value);
  }

  function generateTraits(uint256 _assetId) external view override returns (string memory traits) {
    ISnapshotStore.Snapshot memory snapshot = snapshotStore.getSnapshot(_assetId);
    uint256 vp = snapshotStore.getVp(_assetId);
    traits = string(
      abi.encodePacked(
        '{',
        '"trait_type": "id" , "value":"',
        snapshot.id,
        '"},',
        '{"trait_type": "title" , "value":"',
        snapshot.title,
        '"},',
        '{"trait_type": "',
        snapshot.choices,
        '", "value":"',
        snapshot.scores,
        '"},',
        '{"trait_type": "start" , "value":"',
        snapshot.start.toString(),
        '"},',
        '{"trait_type": "end" , "value":"',
        snapshot.end.toString(),
        '"},',
        '{"trait_type": "vp" , "value":"',
        vp.toString(),
        '"}'
      )
    );
  }

  struct StackFrame2 {
    uint width;
    SVG.Element background;
    string idNouns;
    SVG.Element svgNouns;
    string svg;
    string idNouns553;
    SVG.Element svgNouns553;
    string svg553;
    string seriesText;
    SVG.Element series;
    SVG.Element nouns;
    SVG.Element nouns553;
  }

  function generateSVGPart(uint256 _assetId) public view override returns (string memory svgPart, string memory tag) {
    StackFrame2 memory stack;
    tag = string(abi.encodePacked('pnouns_', _assetId.toString()));

    // title
    stack.seriesText = snapshotStore.getTitle(_assetId);
    stack.width = SVG.textWidth(font, stack.seriesText);
    stack.series = SVG.text(font, stack.seriesText).fill('#224455').transform(TX.translate(5, 980).scale('0.04'));

    // main Noun
    (stack.svg, stack.idNouns) = nounsProvider.getNounsSVGPart(_assetId);
    stack.svgNouns = SVG.element(bytes(stack.svg));
    stack.nouns = SVG.use(stack.idNouns).transform('translate(52,52) scale(0.9)');

    // background
    stack.background = SVG.rect().fill((_assetId % 100 == 0 ? '#d5d7e1' : (_assetId % 2 == 0 ? '#CCFFCC' : '#FFCCD8')));

    // Noun553
    stack.idNouns553 = 'Noun5530r556';
    stack.svg553 = nounsProvider.svgForSeed(
      (_assetId % 100 == 0 ? seedFor000 : (_assetId % 2 == 0 ? seedFor553 : seedFor556)),
      stack.idNouns553
    );

    stack.svgNouns553 = SVG.element(bytes(stack.svg553));
    stack.nouns553 = noun553or556vp(_assetId, stack.idNouns553);

    svgPart = string(
      SVG
        .list(
          [
            stack.svgNouns,
            stack.svgNouns553,
            SVG.group([stack.background, stack.series, stack.nouns, stack.nouns553]).id(tag)
          ]
        )
        .svg()
    );
  }

  struct StackFrame3 {
    uint256 noun553Position;
    uint256 noun553X;
    uint256 noun553Y;
    uint256 noun553Rotate;
  }

  function noun553or556vp(uint _assetId, string memory idNouns553) internal view returns (SVG.Element memory) {
    uint count = snapshotStore.getVp(_assetId);
    SVG.Element[] memory elements = new SVG.Element[](count);
    Randomizer.Seed memory seed = Randomizer.Seed(_assetId, 0);

    for (uint i = 0; i < count; i++) {
      StackFrame3 memory stack;
      // define position of Noun553
      // 0:left, 1:right, 2:top, 3:bottom
      (seed, stack.noun553Position) = seed.random(4);

      if (stack.noun553Position == 0) {
        (seed, stack.noun553X) = seed.random(256);
        (seed, stack.noun553Y) = seed.random(256 * 3 + 100);
      } else if (stack.noun553Position == 1) {
        (seed, stack.noun553X) = seed.random(256);
        stack.noun553X += 256 * 3;
        (seed, stack.noun553Y) = seed.random(256 * 3 + 100);
      } else if (stack.noun553Position == 2) {
        (seed, stack.noun553X) = seed.random(256 * 2);
        stack.noun553X += 256;
        (seed, stack.noun553Y) = seed.random(256);
      } else if (stack.noun553Position == 3) {
        (seed, stack.noun553X) = seed.random(256 * 2);
        stack.noun553X += 256;
        (seed, stack.noun553Y) = seed.random(256);
        stack.noun553Y += 256 * 3;
      }
      stack.noun553Rotate = (stack.noun553X * stack.noun553Y) % 360;

      elements[i] = SVG.use(idNouns553).transform(
        string(
          abi.encodePacked(
            'translate(',
            stack.noun553X.toString(),
            ',',
            stack.noun553Y.toString(),
            ') scale(0.15) rotate(',
            stack.noun553Rotate.toString(),
            ' 200 200)'
          )
        )
      );
    }
    return SVG.group(elements);
  }

  function generateSVGDocument(uint256 _assetId) external view override returns (string memory document) {
    string memory svgPart;
    string memory tag;
    (svgPart, tag) = generateSVGPart(_assetId);
    document = SVG.document('0 0 1024 1024', bytes(svgPart), SVG.use(tag).svg());
  }
}
