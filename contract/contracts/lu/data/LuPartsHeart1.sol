pragma solidity ^0.8.6;

import "./IParts.sol";

contract LuPartsHeart1 is IParts {

      function svgData() external pure override returns(uint16 sizes, bytes[] memory paths, string[] memory fill, uint8[] memory stroke) {
          sizes = 13;
          paths = new bytes[](13);
          fill = new string[](13);
          stroke = new uint8[](13);

          paths[0] = "\x4d\x70\x11\x98\x07\x63\xd4\x54\x00\xb0\x44\xd6\x84\x44\xce\xcd\x44\xeb\xad\x44\xc4\x7d\x44\xae\xcd\x44\xdb\x94\x44\xbf\x62\x44\x97\xf7\x44\xf4\xcf\x44\xcc\xbe\x44\xc2\x43\x40\xd8\x20\x56\x02\x9a\x55\x61\x64\x55\xe3\x18\x65\x9a\x47\x75\x08\x75\x05\x63\x10\x45\xfd\x53\x45\xd6\x66\x45\xc4\x05\x45\xfc\x58\x45\xe1\x62\x45\xd8\x0f\x45\xf4\x33\x45\xf2\x41\x45\xf2\x43\x80\x19\x02\x85\x42\x00\x85\x4e\x00\x05\x63\x96\x55\x15\xd7\x55\x69\xa0\x65\x03\xfb\x54\x10\xbc\x54\x63\xb4\x54\x71\x04\x55\x01\xb9\x54\x4c\xa5\x54\x60\xf7\x54\x13\xdf\x54\x13\xd6\x54\x21\xed\x54\x1c\xc3\x54\x19\xb0\x54\x32\xed\x54\x14\xcf\x54\x10\xbd\x54\x21\xf7\x54\x0b\xc9\x54\x29\xb5\x54\x35\x43\x70\x3f\x7d\x77\x23\x99\x77\x11\x98\x07\x5a";
          paths[1] = "\x4d\x80\xf6\xa8\x05\x63\x00\x45\x9b\xc0\x44\x78\x65\x44\x67\xed\x44\xf6\xd9\x54\x09\xc4\x54\x01\xf6\x44\xfe\xc6\x44\xff\xb8\x54\x0a\xee\x54\x10\xa7\x54\x22\x9e\x54\x28\xed\x54\x13\x97\x54\x45\x8f\x54\x3f\xb8\x44\xde\x63\x44\xcf\x14\x44\xc7\xb6\x54\x04\x92\x44\xfe\x4f\x54\x26\xe6\x54\x16\xc0\x54\x2b\xb6\x54\x4e\xe2\x54\x31\xec\x54\x83\x1b\x55\xa7\x0e\x55\x09\x3b\x55\x32\x42\x55\x3f\x31\x55\x28\x6b\x55\x44\x9e\x55\x69\x2f\x55\x15\x4e\x55\x3a\x7e\x55\x4f\x3e\x55\x0d\x69\x55\x45\x8c\x55\x2d\xf5\x54\x07\x0c\x45\xf6\x10\x45\xf2\x73\x50\x44\xd2\x54\x4e\xc7\x04\x63\x12\x45\xec\x30\x45\xf1\x43\x45\xdf\x13\x45\xe6\x3c\x45\xe8\x4f\x45\xd0\x08\x45\xf0\x22\x45\xf1\x2a\x45\xdf\x05\x45\xf9\x55\x45\xae\x5b\x45\xa0\x12\x45\xe3\x34\x45\xbc\x46\x45\x9f\x43\x80\xe3\xf8\x85\xfa\xb4\x85\xf6\xa8\x05\x5a";
          paths[2] = "\x4d\x60\x3c\xd6\x06\x63\xf5\x54\x0d\xdc\x54\x1d\xcf\x54\x29\xf7\x54\x07\xee\x44\xf6\xe8\x44\xf2\xf5\x44\xf4\xe3\x44\xf2\xd8\x44\xe7\xee\x44\xf1\xd5\x44\xef\xc8\x44\xdb\x01\x45\xfd\x11\x45\xf3\x14\x45\xf0\x0d\x45\xfd\x30\x45\xd9\x38\x45\xe1\x0a\x55\x10\x20\x55\x13\x29\x55\x25\x61\x50\x23\x23\x55\x00\x00\x55\x00\x10\x55\x0c\x43\x60\x28\xbb\x66\x2f\xcb\x66\x3c\xd6\x06\x5a";
          paths[3] = "\x4d\x50\x0d\xf0\x05\x43\x0b\x55\xe9\x10\x55\xd4\x18\x55\xd3\x63\x50\x24\x0a\x55\x51\x06\x55\x75\x0d\x55\x07\x02\x45\xfe\x11\x55\x03\x17\x55\x00\x46\x55\x26\x22\x45\xcf\x4a\x45\xf4\xfe\x44\xc9\x10\x45\xc1\x06\x05\x43\x05\x65\x2a\x10\x55\xfb\x0d\x55\xf0\x5a\x00";
          paths[4] = "\x4d\x60\xc2\xc2\x05\x63\xf3\x44\xfb\xe8\x44\xf0\xd9\x44\xf1\xfc\x54\x00\xf7\x54\x00\xf7\x44\xfa\x00\x45\xfe\xfe\x44\xfd\xfd\x44\xfe\x73\x40\xf9\xfe\x44\xf6\xfd\x04\x63\xf5\x44\xfa\xeb\x44\xf4\xde\x44\xf5\xf1\x44\xf9\xf9\x44\xdd\xf2\x44\xd0\x00\x45\xfa\xf6\x44\xe0\x00\x45\xe2\x0f\x55\x05\x38\x55\x09\x3c\x55\x0b\x0c\x55\x08\x1a\x55\x06\x27\x55\x0a\x06\x55\x02\x0b\x55\x2c\x09\x55\x3a\x53\x60\xc2\xb7\x65\xc2\xc2\x05\x5a";
          paths[5] = "\x4d\x80\x48\x5f\x05\x63\x01\x45\xf0\x13\x45\xb3\x1b\x45\xb2\x0e\x55\x02\x1b\x55\x02\x27\x55\x09\x14\x55\x02\x21\x55\x0f\x33\x55\x17\x06\x55\x03\x26\x55\x1f\x29\x55\x2c\x73\x40\xb2\x1f\x45\xa5\x29\x05\x63\xfb\x54\x02\xf9\x54\x02\xf7\x44\xfc\xf6\x44\xee\xdc\x44\xe6\xca\x44\xe0\x51\x80\x47\x63\x85\x48\x5f\x05\x5a";
          paths[6] = "\x4d\x80\x3a\xcc\x06\x63\xfb\x54\x07\xf6\x54\x11\xee\x54\x13\x73\x40\xd7\x1d\x45\xcb\x25\x05\x63\xf0\x54\x04\xe9\x44\xe0\xdf\x44\xd7\xfc\x44\xfc\xf9\x44\xf8\xfc\x44\xf2\x07\x45\xed\x20\x45\xf0\x28\x45\xdd\x06\x45\xf7\x0a\x45\xf1\x15\x45\xfa\x43\x80\x1a\xb0\x86\x2b\xbd\x86\x3a\xcc\x06\x5a";
          paths[7] = "\x4d\x70\xb8\xda\x06\x63\x05\x55\x07\x26\x55\x32\x1e\x55\x36\xf2\x54\x02\xea\x54\x1f\xe0\x54\x0f\x43\x70\x9e\xfa\x76\x92\xef\x76\xb8\xda\x06\x5a";
          paths[8] = "\x4d\x60\xe6\x7b\x07\x61\x48\x55\x48\x00\x55\x00\x01\x45\xe2\xf1\x04\x63\xfd\x44\xfc\xfb\x44\xff\xf8\x44\xfb\x03\x45\xf8\x0f\x45\xf0\x13\x45\xe8\x73\x50\x15\x09\x55\x1d\x0c\x55\x02\x0c\x55\x00\x11\x05\x53\xec\x76\x7d\xe6\x76\x7b\x5a\x00";
          paths[9] = "\x4d\x60\xfc\x65\x07\x63\xe5\x54\x00\x94\x44\xbc\x89\x44\xb3\x61\x70\x23\x23\x57\x00\x00\x55\x01\xbd\x44\xd1\x63\x40\xf2\xf5\x44\xe3\xe9\x44\xcd\xda\x04\x6c\xff\x44\xff\x63\x40\xf8\xfa\x44\xed\xf0\x44\xe0\xe5\x04\x73\xdb\x44\xe0\xd6\x44\xdd\x6c\x40\xfe\xff\x04\x43\x8c\x65\x5f\x71\x65\x1a\x83\x55\xdf\x63\x50\x0f\xcf\x54\x3b\xb1\x54\x75\xb1\x04\x61\xd3\x55\xd3\x00\x55\x00\x01\x55\x18\x01\x05\x63\x08\x55\x00\x35\x55\x04\x36\x55\x04\x15\x55\x00\x36\x55\x0f\x56\x55\x1c\x12\x55\x08\x2a\x55\x12\x30\x55\x12\x68\x50\x02\x63\x50\x0c\x00\x55\x15\x07\x55\x1f\x0e\x55\x06\x04\x55\x0d\x09\x55\x11\x09\x05\x53\x3a\x57\xb7\x51\x57\xa8\x63\x50\x0f\xf6\x54\x1b\xee\x54\x24\xe9\x04\x73\x22\x45\xf1\x3b\x45\xeb\x63\x50\x10\xfc\x54\x33\xee\x54\x33\xee\x04\x53\x12\x58\x61\x2a\x58\x61\x63\x50\x22\x00\x55\x3b\x09\x55\x4c\x1a\x55\x1a\x1b\x55\x13\x46\x55\x13\x46\x05\x6c\x00\x55\x03\x63\x40\xfa\x89\x45\x88\xdb\x45\x1a\x2b\x46\xe0\x17\x45\xc2\x2d\x45\xa7\x44\x45\xf1\x12\x45\xdc\x1d\x45\xc9\x28\x05\x43\x0f\x77\x5d\x01\x77\x65\xfc\x76\x65\x5a\x00";
          paths[10] = "\x4d\x70\x41\x2b\x07\x63\xf0\x54\x15\xd5\x54\x20\xbe\x54\x2d\xf4\x54\x0a\x98\x44\xc1\x8d\x44\xb6\xca\x44\xe0\xbd\x44\xcd\x89\x44\xab\xed\x44\xf1\xbe\x44\xc5\xb4\x44\xc1\x43\x50\x65\x38\x56\x74\x8b\x65\x10\x9e\x05\x63\x12\x55\x00\x20\x55\x06\x34\x55\x04\x1f\x45\xfc\x7b\x55\x31\x8b\x55\x2e\x73\x50\x2d\x27\x55\x3e\x0f\x05\x63\x11\x45\xfc\x56\x45\xcb\x6f\x45\xbc\x12\x45\xf2\x5c\x45\xe6\x69\x45\xda\x2c\x45\xf9\x69\x45\xee\x89\x55\x0f\x73\x50\x0e\x3b\x55\x10\x40\x05\x43\x75\x68\x6e\xba\x67\xc5\x41\x77\x2b\x5a\x00";
          paths[11] = "\x4d\x70\x00\x26\x07\x6c\xf8\x44\xff\x73\x40\xd9\xe4\x44\xbf\xd5\x04\x63\xc3\x44\xdb\x74\x44\xab\x57\x44\x6e\xe8\x44\xe2\xe2\x44\xc1\xee\x44\xa5\x73\x50\x27\xd2\x54\x4c\xca\x04\x6c\x02\x55\x00\x68\x50\x02\x63\x50\x38\x03\x55\x63\x11\x55\x84\x29\x55\x19\x0b\x55\x37\x28\x55\x3a\x28\x05\x6c\x09\x45\xf9\x01\x55\x00\x63\x50\x00\xff\x54\x3a\xcb\x54\x3a\xcb\x54\x21\xe9\x54\x4b\xdc\x54\x6f\xdc\x04\x73\x40\x55\x0c\x53\x55\x24\x63\x50\x21\x20\x55\x14\x4e\x45\xdc\x80\x45\xf5\x0a\x45\xe6\x18\x45\xd5\x29\x05\x43\x6a\x67\xe6\x25\x77\x26\x00\x77\x26\x5a\x00";
          paths[12] = "\x4d\x70\x09\x03\x07\x6c\xfc\x54\x00\x73\x40\xed\xee\x44\xe1\xe4\x04\x63\xe3\x44\xe8\xbd\x44\xc9\xaf\x44\xa1\xf4\x44\xec\xf1\x44\xd7\xf7\x44\xc4\x41\x50\x34\x34\x55\x00\x00\x55\x01\xb1\x66\x2a\x68\x50\x02\x63\x50\x1b\x02\x55\x30\x0b\x55\x40\x1a\x55\x0c\x07\x55\x1b\x1a\x55\x1c\x1a\x05\x6c\x04\x45\xfb\x00\x55\x00\x1c\x45\xde\x63\x50\x10\xf1\x54\x24\xe8\x54\x36\xe8\x04\x73\x1f\x55\x08\x28\x55\x17\x63\x50\x10\x15\x55\x09\x33\x45\xee\x53\x05\x6c\xeb\x54\x1b\x43\x70\x3c\xda\x76\x1b\x03\x77\x09\x03\x07\x5a";
          fill[0] = "#504650";
          fill[1] = "#dd57b1";
          fill[2] = "#ffa141";
          fill[3] = "#ff79c1";
          fill[4] = "#9d6cd8";
          fill[5] = "#ffa141";
          fill[6] = "#ff79c1";
          fill[7] = "#9d6cd8";
          fill[8] = "#ff79c1";
          fill[9] = "none";
          fill[10] = "#66c5c8";
          fill[11] = "#af5395";
          fill[12] = "#de6b96";
          stroke[0] = 0;
          stroke[1] = 0;
          stroke[2] = 0;
          stroke[3] = 0;
          stroke[4] = 0;
          stroke[5] = 0;
          stroke[6] = 0;
          stroke[7] = 0;
          stroke[8] = 0;
          stroke[9] = 0;
          stroke[10] = 0;
          stroke[11] = 0;
          stroke[12] = 0;
      }
}