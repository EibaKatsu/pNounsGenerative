import { ethers, network } from "hardhat";
import { writeFile } from "fs";
import addresses from '@nouns/sdk/dist/contract/addresses.json';
import { addresses as addresses2 } from "../../src/utils/addresses";
const lonrinaFont = addresses2.londrina_solid[network.name];
console.log(`       lonrinaFont="${lonrinaFont}"`);

const nounsDescriptor:string = (network.name == "goerli") ?
  addresses[5].nounsDescriptor: addresses[1].nounsDescriptor;
const nounsToken:string = (network.name == "goerli") ?
  addresses[5].nounsToken: addresses[1].nounsToken;

async function main() {
  // const factoryNouns = await ethers.getContractFactory("NounsAssetProvider");
  // const nouns = await factoryNouns.deploy(nounsToken, nounsDescriptor);
  // await nouns.deployed();
  // console.log(`      nouns="${nouns.address}"`);
  const nouns = "0x4727A5e9616abee31da7dB25F8A817Ca9D3C2f00";

  const factory = await ethers.getContractFactory("JapaNounsProvider2");
  const contract = await factory.deploy(lonrinaFont, nouns,[3,4]);
  console.log("JapaNounsProvider2 deplot start");
  await contract.deployed();
  console.log("JapaNounsProvider2 deplot end");

  for(var i=1; i<9; i++){
    console.log("write start",i);
    const result = await contract.generateSVGDocument(i);
    await writeFile("./cache/test8-" + i + ".svg", result, ()=>{});  
    console.log("write end",i);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
