import { ethers, network } from "hardhat";
import { writeFile } from "fs";
import { addresses } from "../../src/utils/addresses";

// const nounsProvider = addresses.nounsV2[network.name];
const nounsProvider = "0x9385bA0ac58A29720Ff1a746f1CE60C6c7FfFA93";
// const lonrinaFont = addresses.londrina_solid[network.name];
const lonrinaFont = "0x5Cad7e6dFdC0a4Fbd6664aEA2CC100Bb8c915D77";
const nounsId = (network.name == "goerli") ? 4 : 553;

async function main() {
  const factory = await ethers.getContractFactory("PNounsPrivider2");
  const contract = await factory.deploy(lonrinaFont, nounsProvider, nounsId);
  await contract.deployed();
  console.log(`      contract="${contract.address}"`);

  for (let i=0; i<11; i++) {
    if (i == 5 && network.name == "goerli") {
      console.log("switching nounsId");
      const tx = await contract.setNounsId(nounsId + 1);
      await tx.wait();
    }
    const currentId = await contract.nounsId();
    const n = Math.pow(2,i);
    const result = await contract.generateSVGDocument(n);
    await writeFile(`./cache/pnouns2_${n}.svg`, result, ()=>{});
    console.log("output", n, currentId);  
  }

  const addresses = `export const addresses = {\n`
    + `  pnouns:"${contract.address}",\n`
    + `}\n`;
  await writeFile(`../src/utils/addresses/pnouns2_${network.name}.ts`, addresses, ()=>{});
  
  console.log(`npx hardhat verify ${contract.address} ${lonrinaFont} ${nounsProvider} ${nounsId} --network ${network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
