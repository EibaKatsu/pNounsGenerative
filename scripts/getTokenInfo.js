require('dotenv').config();
const fs = require('fs');

// axios を require してインスタンスを生成する
const axiosBase = require('axios');

async function main() {
  // const config = JSON.parse(fs.readFileSync('./public/config/cdao_tokenids.json', 'utf8'));
  // const config = JSON.parse(fs.readFileSync('./public/config/cba_tokenids.json', 'utf8'));
  // const config = JSON.parse(fs.readFileSync('./public/config/skb_tokenids.json', 'utf8'));
  const contract_address = "0x4bE962499cE295b1ed180F923bf9c73b6357DE80";

  // console.log("contarct: ", config.contract_address);
  // console.log("token number: ", config.tokenIds.length);


  const cmd_url = "https://eth-mainnet.g.alchemy.com/nft/v2/" + process.env.ALCHEMY_API_KEY + "/";
  // const cmd_url = "https://polygon-mainnet.g.alchemy.com/nft/v2/" + process.env.VUE_APP_ALCKEMY_ETH_KEY + "/";
  // const cmd_getNftMetadata = "getNFTMetadata?contractAddress=" + config.contract_address + "&tokenType=ERC1155&refreshCache=false";
  const cmd_getOwnersForToken = "getOwnersForToken?contractAddress=" + contract_address;

  const axios = axiosBase.create({
    baseURL: cmd_url, // バックエンドB のURL:port を指定する
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    responseType: 'json'
  });

  for (var i = 1; i <= 2100; i++) {
    await wait(3);
    // await getNftMetadata(axios, cmd_getNftMetadata, config.tokenIds[i]);
    // await getNftMetadata(axios, cmd_getOwnersForToken, config.tokenIds[i]);
    await getNftMetadata(axios, cmd_getOwnersForToken, i);
  };

  console.error("getTokenInfo finish!");

}


var countGetNft = 0;
async function getNftMetadata(axios, cmd, _tokenId) {
  var metadata = {};
  try {
    await axios.get(cmd + "&tokenId=" + _tokenId)
      .then(function (response) {
        countGetNft++;

        // console.log(_tokenId, response.data.title);
        for (var i = 0; i < response.data.owners.length; i++) {
          console.log(_tokenId, ",", response.data.owners[i]);
        }

      }
      );
  } catch (e) {
    countGetNft++;

    console.log(_tokenId, "error");
  }

}

const wait = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(); // setTimeoutの第一引数の関数として簡略化できる
    }, ms)
  });
}

main();

