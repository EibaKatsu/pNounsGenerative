import { ethers, network } from "hardhat";
import { writeFile } from "fs";
import { addresses } from "../../src/utils/addresses";

// const nounsProvider = addresses.nounsV2[network.name];
const nounsProvider = "0x9385bA0ac58A29720Ff1a746f1CE60C6c7FfFA93";
// const lonrinaFont = addresses.londrina_solid[network.name];
const lonrinaFont = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";
// const nounsId = (network.name == "goerli") ? 4 : 556;
const nounsId = 4;

async function main() {
  const factory = await ethers.getContractFactory("PNounsProvider556");
  console.log("nounsProvider:",nounsProvider);
  console.log("lonrinaFont:",lonrinaFont);
  console.log("nounsId:",nounsId);
  const contract = await factory.deploy(lonrinaFont, nounsProvider, nounsId);
  console.log(`test2"`);
  await contract.deployed();
  console.log(`      contract="${contract.address}"`);

  for (let i=0; i<11; i++) {
    if (i == 5 && network.name == "goerli") {
      console.log("switching nounsId");
      const tx = await contract.setNounsId(nounsId + 1);
      await tx.wait();
    }
    console.log("i:",i);
    const currentId = await contract.nounsId();
    console.log("currentId:",currentId);
    const n = Math.pow(2,i);
    const result = await contract.generateSVGDocument(n);
    await writeFile(`./cache/pnouns556_${n}.svg`, result, ()=>{});
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
