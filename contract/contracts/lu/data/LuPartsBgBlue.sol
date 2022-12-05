pragma solidity ^0.8.6;

import "./IParts.sol";

contract LuPartsBgBlue is IParts {

      function svgData() external pure override returns(uint16 sizes, bytes[] memory paths, string[] memory fill, uint8[] memory stroke) {
          sizes = 4;
          paths = new bytes[](4);
          fill = new string[](4);
          stroke = new uint8[](4);

          paths[0] = "\x4d\x50\x00\x00\x05\x48\x00\x09\x56\x00\x09\x48\x00\x05\x5a";
          paths[1] = "\x4d\x80\x9a\x0e\x08\x61\x5c\x55\x5c\x00\x55\x00\x01\x45\xe8\x00\x05\x63\x8a\x44\xf9\x0b\x54\x02\x91\x43\xff\x8c\x54\x02\x18\x54\x03\xa3\x53\x09\xfa\x54\x01\xce\x44\xf8\xc6\x44\xfa\x43\x50\x3e\x1c\x48\xfd\xff\x57\x00\x11\x08\x56\x20\x08\x63\x45\x55\x03\x8a\x55\x00\xcf\x55\x03\x1e\x55\x02\x3d\x55\x08\x5b\x55\x02\x1a\x45\xfc\x39\x45\xf5\x53\x45\xfa\x33\x55\x0a\x63\x45\xfe\x96\x45\xf8\x08\x45\xff\x10\x55\x00\x16\x55\x01\x16\x55\x07\x2d\x55\x0e\x47\x55\x0a\x35\x45\xf7\x6c\x45\xef\xa3\x45\xf7\x18\x55\x04\x31\x45\xfa\x49\x45\xfe\x36\x55\x0a\x6e\x55\x09\xa5\x55\x04\x56\x80\x09\x63\x40\xe9\x00\x45\xd2\x02\x45\xbc\x06\x05\x43\xb0\x88\x10\xa6\x88\x0c\x9a\x88\x0e\x5a\x00";
          paths[2] = "\x4d\x80\xff\x2c\x08\x63\xcd\x54\x04\x9c\x54\x0d\x6a\x54\x03\xf6\x44\xfe\xea\x44\xff\xe1\x44\xff\xe2\x54\x00\xc5\x44\xf7\xab\x44\xfb\x78\x54\x10\xf8\x53\x08\x74\x53\x09\xa9\x54\x00\x4f\x54\x01\xf8\x53\x00\xe0\x44\xff\xbf\x54\x00\x9f\x54\x01\x76\x50\x10\x63\x50\x1e\xff\x54\x3d\xfc\x54\x5b\xfb\x54\x2f\xff\x54\x5f\x01\x55\x90\x05\x55\x1a\x01\x55\x33\x06\x55\x4f\x05\x05\x73\x35\x45\xfd\x4f\x45\xfc\x63\x50\x20\xff\x54\x3d\x03\x55\x5d\x04\x55\x1c\x01\x55\x35\xfe\x54\x51\xfe\x54\x57\x01\x55\xad\xfc\x64\x04\xf9\x54\x14\xff\x54\x27\x04\x55\x3d\x01\x05\x61\x09\x66\x09\x00\x55\x00\x01\x55\x3b\x00\x05\x63\x1b\x55\x03\x35\x55\x03\x4e\x55\x03\x56\x80\x2b\x5a\x00";
          paths[3] = "\x4d\x80\x5b\x16\x08\x63\xe8\x44\xfc\xcf\x54\x06\xb7\x54\x02\xc9\x44\xf7\x92\x54\x00\x5d\x54\x09\xe6\x54\x04\xcf\x44\xfd\xb9\x44\xf6\xfa\x44\xff\xf2\x44\xfe\xea\x44\xff\xcd\x54\x06\x9e\x54\x12\x6a\x54\x09\xe6\x44\xfc\xc7\x54\x02\xad\x54\x07\xe3\x54\x05\xc3\x54\x00\xa5\x44\xfe\xbb\x44\xfd\x76\x54\x00\x31\x44\xfd\x76\x50\x11\x63\x50\x20\xff\x54\x41\xff\x54\x61\x00\x55\x57\x01\x55\xb1\x00\x65\x08\x00\x55\x84\xff\x64\x04\x08\x65\x8c\xf7\x54\x1a\xfd\x54\x37\x05\x55\x55\x05\x55\x0a\x00\x55\x16\xff\x54\x20\x01\x55\x31\x0a\x55\x62\x01\x55\x96\xfd\x04\x68\x02\x05\x76\xef\x04\x43\xc9\x88\x1f\x91\x88\x20\x5b\x88\x16\x5a\x00";
          fill[0] = "#66c5c8";
          fill[1] = "#ff87c5";
          fill[2] = "#ccd7c7";
          fill[3] = "#fff";
          stroke[0] = 0;
          stroke[1] = 0;
          stroke[2] = 0;
          stroke[3] = 0;
      }
}