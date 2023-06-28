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

  function generateTraits(uint256 _assetId) external pure override returns (string memory traits) {
    // nothing to return
  }

  // Hack to deal with too many stack variables
  struct Stackframe {
    uint trait; // 0:small, 1:middle, 2:large
    uint degree;
    uint distance;
    uint radius;
    uint rotate;
    int x;
    int y;
  }

  function circles(uint _assetId) internal pure returns (SVG.Element memory) {
    string[4] memory colors = ['red', 'green', 'yellow', 'blue'];
    uint count = 10;
    SVG.Element[] memory elements = new SVG.Element[](count);
    Randomizer.Seed memory seed = Randomizer.Seed(_assetId, 0);

    for (uint i = 0; i < count; i++) {
      Stackframe memory stack;
      stack.trait = (i + 1) / 4; // 3:4:3
      if (stack.trait == 0) {
        (seed, stack.distance) = seed.random(100);
        stack.distance += 380;
        (seed, stack.radius) = seed.random(40);
        stack.radius += 40;
        (seed, stack.rotate) = seed.random(360);
      } else if (stack.trait == 1) {
        (seed, stack.distance) = seed.random(100);
        stack.distance += 320; // instaead of 200
        (seed, stack.radius) = seed.random(70);
        stack.radius += 70;
        (seed, stack.rotate) = seed.random(240);
        stack.rotate += 240;
      } else {
        (seed, stack.distance) = seed.random(180);
        stack.distance += 100; // instaead of 0
        (seed, stack.radius) = seed.random(70);
        stack.radius += 180;
        (seed, stack.rotate) = seed.random(120);
        stack.rotate += 300;
      }
      (seed, stack.degree) = seed.random(0x4000);
      stack.x = 512 + (stack.degree.cos() * int(stack.distance)) / Vector.ONE;
      stack.y = 512 + (stack.degree.sin() * int(stack.distance)) / Vector.ONE;
      elements[i] = SVG.circle(stack.x, stack.y, int(stack.radius + stack.radius / 10)).fill(colors[i % 4]).opacity(
        '0.333'
      );
    }
    return SVG.group(elements);
  }

  struct StackFrame2 {
    uint width;
    SVG.Element pnouns;
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
    uint256 noun553Position;
    uint256 noun553X;
    uint256 noun553Y;
  }

  function generateSVGPart(uint256 _assetId) public view override returns (string memory svgPart, string memory tag) {
    StackFrame2 memory stack;
    tag = string(abi.encodePacked('pnouns_', _assetId.toString()));

    // title
    stack.seriesText = snapshotStore.getTitle(_assetId);
    stack.width = SVG.textWidth(font, stack.seriesText);
    stack.series = SVG.text(font, stack.seriesText).fill('#224455').transform(
      TX.translate(52, 1024 - 52).scale('0.04')
    );

    // main Noun
    (stack.svg, stack.idNouns) = nounsProvider.getNounsSVGPart(_assetId);
    stack.svgNouns = SVG.element(bytes(stack.svg));
    stack.nouns = SVG.use(stack.idNouns).transform('translate(52,52) scale(0.9)');

    // define position of Noun553
    Randomizer.Seed memory seed = Randomizer.Seed(_assetId, 0);
    (seed, stack.noun553Position) = seed.random(3);
    (seed, stack.noun553X) = seed.random(100);
    (seed, stack.noun553Y) = seed.random(400);
    // stack.noun553X = 100;
    // stack.noun553Y = 400;
    // stack.noun553Position = _assetId % 3;
    if (stack.noun553Position % 2 == 0) {
      stack.noun553X += 700;
    }
    if (stack.noun553Position < 2) {
      stack.noun553Y += 500;
    }

    // Noun553
    stack.idNouns553 = 'Noun5530r556';
    stack.svg553 = nounsProvider.svgForSeed((_assetId % 2 == 0 ? seedFor553 : seedFor556), stack.idNouns553);
    stack.svgNouns553 = SVG.element(bytes(stack.svg553));
    stack.nouns553 = SVG.use(stack.idNouns553).transform(
      string(abi.encodePacked('translate(', stack.noun553X.toString(), ',', stack.noun553Y.toString(), ') scale(0.15)'))
    );

    svgPart = string(
      SVG
        .list([stack.svgNouns, stack.svgNouns553, SVG.group([stack.series, stack.nouns, stack.nouns553]).id(tag)])
        .svg()
    );
  }

  function generateSVGDocument(uint256 _assetId) external view override returns (string memory document) {
    string memory svgPart;
    string memory tag;
    (svgPart, tag) = generateSVGPart(_assetId);
    document = SVG.document('0 0 1024 1024', bytes(svgPart), SVG.use(tag).svg());
  }
}
