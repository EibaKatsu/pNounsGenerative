import { ethers, network } from "hardhat";
import { writeFile } from "fs";

const waitForUserInput = (text: string) => {
  return new Promise((resolve, reject) => {
    process.stdin.resume()
    process.stdout.write(text)
    process.stdin.once('data', data => resolve(data.toString().trim()))
  })
};

async function main() {
  const factoryToken = await ethers.getContractFactory("NounsBaseOgiriTrophy");
  const token = await factoryToken.deploy();
  await token.deployed();
  console.log(`      token="${token.address}"`);

  const addresses = `export const addresses = {\n`
    + `  NounkoBase:"${token.address}"\n`
    + `}\n`;
  await writeFile(`../src/utils/addresses/nounsBaseOgiriTrophy_${network.name}.ts`, addresses, ()=>{});

  console.log(`npx hardhat verify ${token.address} --network ${network.name}`);  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
