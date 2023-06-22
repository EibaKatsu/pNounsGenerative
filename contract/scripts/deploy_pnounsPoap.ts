import { ethers, network } from 'hardhat';
import { exec } from 'child_process';
import addresses from '@nouns/sdk/dist/contract/addresses.json';

// const nounsDescriptor: string = network.name == 'goerli' ? addresses[5].nounsDescriptor : addresses[1].nounsDescriptor;
// const nounsSeeder: string = network.name == 'goerli' ? addresses[5].nounsSeeder : addresses[1].nounsSeeder;
// const nftDescriptor: string = network.name == 'goerli' ? addresses[5].nftDescriptor : addresses[1].nftDescriptor;

const nounsToken: string = '0xf8f404afD11A2E6caAa1f3E8C62a0143813b272E';  // mumbai
const font: string = '0xF3636358069588D2A16a81d27e7e8cB15Eb3827B';  // mumbai
const nounsDescriptor: string = '0xA6f003aa2E8b8EbAe9e3b7792719A08Ea8683107'; // mumbai
const nounsSeeder: string = '0x5f5C984E0BAf150D5a74ae21f4777Fd1947DE8c9'; // mumbai
const nftDescriptor: string = '0xC93218fF7C44cbEB57c7661DCa886deCBc0E07C0'; // mumbai

// const nounsDescriptor: string = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'; // localhost
// const nounsSeeder: string = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'; // localhost
// const nftDescriptor: string = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // localhost

const committee = "0x52A76a606AC925f7113B4CC8605Fe6bCad431EbB";
// const committee = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // localhost

async function main() {

  const factoryAssetProvider = await ethers.getContractFactory('NounsAssetProviderV2');
  const assetProvider = await factoryAssetProvider.deploy(nounsToken);
  await assetProvider.deployed();
  console.log(`##NounsAssetProviderV2="${assetProvider.address}"`);
  await runCommand(`npx hardhat verify ${assetProvider.address} ${nounsToken} --network ${network.name} &`);


  const factoryPnounsProvider = await ethers.getContractFactory('PNounsProvider3');
  const pnounsProvider = await factoryPnounsProvider.deploy(font, assetProvider.address, nounsToken);
  await pnounsProvider.deployed();
  console.log(`##PNounsProvider3="${pnounsProvider.address}"`);
  await runCommand(`npx hardhat verify ${pnounsProvider.address} ${font} ${assetProvider.address} ${nounsToken} --network ${network.name} &`);

  const factoryPnounsPoap = await ethers.getContractFactory('PNounsPoapToken');
  const pnounsPoap = await factoryPnounsPoap.deploy(assetProvider.address, nounsToken, [committee]);
  await pnounsPoap.deployed();
  console.log(`##PNounsPoapToken="${pnounsPoap.address}"`);
  await runCommand('#★★★ tmp/PNounsPoapToken.ts に引数を指定★★★');
  await runCommand(` ${pnounsPoap.address} ${assetProvider.address} ${nounsToken} ${[committee]}`);
  await runCommand(`npx hardhat verify ${pnounsPoap.address} --network ${network.name} --constructor-args tmp/PNounsPoapToken.ts`);

}

async function runCommand(command: string) {
  if (network.name !== 'localhost') {
    console.log(command);
  }
  // なぜかコマンドが終了しないので手動で実行
  // await exec(command, (error, stdout, stderr) => {
  //     if (error) {
  //         console.log(`error: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.log(`stderr: ${stderr}`);
  //         return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  // });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});