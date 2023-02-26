// SPDX-License-Identifier: MIT

/**
 *
 * Created by eiba (@eiba8884)
 */

pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import 'assetprovider.sol/IAssetProvider.sol';
import 'randomizer.sol/Randomizer.sol';
import '@openzeppelin/contracts/interfaces/IERC165.sol';
import '../packages/graphics/Path.sol';
import '../packages/graphics/SVG.sol';
import '../packages/graphics/Text.sol';
import '../packages/graphics/IFontProvider.sol';

contract JapaNounsProvider is IAssetProviderEx, Ownable, IERC165 {
  using Strings for uint256;
  using Randomizer for Randomizer.Seed;
  using Vector for Vector.Struct;
  using Path for uint256[];
  using SVG for SVG.Element;
  using TX for string;
  using Trigonometry for uint256;

  IFontProvider public immutable font;
  IAssetProvider public immutable nounsProvider;

  constructor(IFontProvider _font, IAssetProvider _nounsProvider) {
    font = _font;
    nounsProvider = _nounsProvider;
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
    uint256 trait; // 0:small, 1:middle, 2:large
    uint256 degree;
    uint256 distance;
    uint256 radius;
    uint256 rotate;
    int256 x;
    int256 y;
  }

  function circles(uint256 _assetId, string[] memory idNouns) internal pure returns (SVG.Element memory) {
    string[4] memory colors = ['red', 'green', 'yellow', 'blue'];
    uint256 count = 6;
    SVG.Element[] memory elements = new SVG.Element[](count);
    Randomizer.Seed memory seed = Randomizer.Seed(_assetId, 0);
    Randomizer.Seed memory seed2;

    for (uint256 i = 0; i < count; i++) {
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
        stack.distance += 200;
        (seed, stack.radius) = seed.random(70);
        stack.radius += 70;
        (seed, stack.rotate) = seed.random(240);
        stack.rotate += 240;
      } else {
        (seed, stack.distance) = seed.random(180);
        stack.distance += 400;
        (seed, stack.radius) = seed.random(70);
        stack.radius += 180;
        (seed, stack.rotate) = seed.random(120);
        stack.rotate += 300;
      }
      seed2 = Randomizer.Seed(_assetId + i, 0);
      (seed2, stack.degree) = seed2.random(0x4000);
      stack.x = 512 + (stack.degree.cos() * int256(stack.distance)) / Vector.ONE;
      stack.y = 512 + (512 + (stack.degree.sin() * int256(stack.distance)) / Vector.ONE) / 2;
      elements[i] = SVG.group(
        [
          SVG.use(idNouns[i % idNouns.length]).transform(
            TX
              .translate(stack.x - int256(stack.radius), stack.y - int256(stack.radius))
              .scale1000((1000 * stack.radius) / 512)
              .rotate(string(abi.encodePacked(stack.rotate.toString(), ',512,512')))
          ),
          SVG.circle(stack.x, stack.y, int256(stack.radius + stack.radius / 10)).fill(colors[i % 4]).opacity('0.333')
        ]
      );
    }
    return SVG.group(elements);
  }

  struct StackFrame2 {
    uint256 width;
    SVG.Element pnouns;
    string[] idNouns;
    SVG.Element[] svgNouns;
    string svg;
    string seriesText;
    SVG.Element series;
  }

  function generateSVGPart(uint256 _assetId) public view override returns (string memory svgPart, string memory tag) {
    StackFrame2 memory stack;
    tag = string(abi.encodePacked('circles', _assetId.toString()));
    stack.width = SVG.textWidth(font, 'JapaNouns');
    stack.pnouns = SVG.text(font, 'JapaNouns').fill('#224455').transform(TX.scale1000((1000 * 1024) / stack.width));

    if (_assetId < 10) {
      stack.seriesText = string(abi.encodePacked('0000', _assetId.toString()));
    } else if (_assetId < 100) {
      stack.seriesText = string(abi.encodePacked('000', _assetId.toString()));
    } else if (_assetId < 1000) {
      stack.seriesText = string(abi.encodePacked('00', _assetId.toString()));
    } else if (_assetId < 10000) {
      stack.seriesText = string(abi.encodePacked('0', _assetId.toString()));
    } else {
      stack.seriesText = string(abi.encodePacked(_assetId.toString()));
    }
    stack.width = SVG.textWidth(font, stack.seriesText);
    stack.series = SVG.text(font, stack.seriesText).fill('#224455').transform(
      TX.translate(1024 - int256(stack.width / 10), 1024 - 102).scale('0.1')
    );

    stack.idNouns = new string[](3);
    stack.svgNouns = new SVG.Element[](3);

    for (uint256 i = 0; i < stack.idNouns.length; i++) {
      (stack.svg, stack.idNouns[i]) = nounsProvider.generateSVGPart(i + _assetId);
      stack.svgNouns[i] = SVG.element(bytes(stack.svg));
    }

    svgPart = string(
      SVG
        .list(
          [
            SVG.list(stack.svgNouns),
            SVG
              .group(
                [
                  SVG.element(bytes(japanounsSVG())),
                  circles(_assetId, stack.idNouns).transform('translate(102,204) scale(0.8)'),
                  stack.pnouns,
                  stack.series
                ]
              )
              .id(tag)
          ]
        )
        .svg()
    );
  }

  function generateSVGDocument(uint256 _assetId) external view override returns (string memory document) {
    string memory svgPart;
    string memory tag;
    (svgPart, tag) = generateSVGPart(_assetId);
    document = SVG.document('0 0 1024 1024', bytes(svgPart), SVG.use(tag).svg());
  }

  function japanounsSVG() public pure returns (string memory document) {
    return
      string(
        abi.encodePacked(
          // "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' buffered-rendering='static' viewBox='0,0,1024,1024'>",
          // '<defs>',
          "<g id='dots' transform='scale(3.3) translate(18,10)'>",
          "<path d='m0,0h280v280h-79v-95h36v-134h-193v134h35v95h-79zm96,219h9v61h-9z' opacity='0'/>",
          "<path d='m44,51h1v1h-1zm192,0h1v1h-1zm-192,133h1v1h-1zm192,0h1v1h-1z' fill='#404040' opacity='0'/>",
          "<path d='m45,51h1v1h-1v1h-1v-1h1zm47,0h2v2h-2zm95,0h2v2h-2zm48,0h1v1h1v1h-1v-1h-1zm1,33h1v2h-1zm0,33h1v2h-1zm0,33h1v2h-1zm0,33h1v1h-1v1h-1v-1h1zm-191,1h1v1h-1z' fill='#404040' opacity='0.33'/>",
          "<path d='m46,51h46v2h-47v-1h1zm48,0h93v2h-93zm95,0h46v1h1v1h1v31h-1v-31h-47zm47,35h1v31h-1zm0,33h1v31h-1zm0,33h1v31h-1zm-190,32h33v1h-33zm155,0h34v1h-34z' fill='#404040' opacity='0.67'/>",
          "<path d='m44,53h2v130h189v-130h1v131h-192z' fill='#bfbfbf'/>",
          "<path d='m46,53h189v130h-189zm86,17h-1v9h-17v9h-9v8h-17v18h-27v26h9v-17h18v26h26v9h17v8h27v-8h17v-9h26v-53h-17v-8h-9v-9h-17v-9zm-36,35h18v35h-18zm62,0h17v35h-17z' fill='#fff'/>",
          "<path d='m131,70h27v9h17v9h9v8h-35v18h-9v-18h-35v-8h9v-9h17zm9,53h9v26h26v9h-17v8h-27v-8h-17v-9h26z' fill='#bf0000'/>",
          "<path d='m88,96h52v18h9v-18h52v53h-52v-26h-9v26h-52v-26h-18v17h-9v-26h27zm9,9h-1v35h35v-35zm62,0h-1v35h35v-35z' fill='#ffbf40'/>",
          "<path d='m114,105h17v35h-17zm61,0h18v35h-18z'/>",
          "<path d='m79,184h122v1h-122z' fill='#4080bf'/>",
          "<path d='m79,185h122v95h-96v-61h-9v61h-17zm88,8h-1v26h9v-9h18v-17zm9,26h-1v9h-9v8h-35v9h9v9h44v-35zm-61,26h-1v18h17v-18zm26,18h-1v8h18v-8z' fill='#40bfff'/>",
          "<path d='m166,193h27v17h-18v9h9v35h-44v-9h-9v18h-17v-18h17v-9h35v-8h9v-9h-9zm-26,70h18v8h-18z' fill='#004000'/>"
          '</g>'
          // ,
          // '</defs>',
          // "<use xlink:href='#dots'/>",
          // '</svg>'
        )
      );
  }
}
