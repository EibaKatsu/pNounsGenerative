import { ethers, network } from 'hardhat';
import { exec } from 'child_process';
import addresses from '@nouns/sdk/dist/contract/addresses.json';

// const nounsDescriptor: string = network.name == 'goerli' ? addresses[5].nounsDescriptor : addresses[1].nounsDescriptor;
// const nounsSeeder: string = network.name == 'goerli' ? addresses[5].nounsSeeder : addresses[1].nounsSeeder;
// const nftDescriptor: string = network.name == 'goerli' ? addresses[5].nftDescriptor : addresses[1].nftDescriptor;

// const nounsToken: string = '0x9625EA365d2983B9da115A789c03d3043fdDD7cB';  // mumbai
const font: string = '0xF3636358069588D2A16a81d27e7e8cB15Eb3827B';  // mumbai
const nounsDescriptor: string = '0xeF0dFbC1da73CF62ec59b4BA7eE8E9AD8472441F'; // mumbai
const nounsSeeder: string = '0xe9F379fD86F04CFa016f650EE56ea969958079e8'; // mumbai
// const nftDescriptor: string = '0x1881c541E9d83880008B3720de0E537C34052ecf'; // mumbai

// const nounsDescriptor: string = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'; // localhost
// const nounsSeeder: string = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'; // localhost
// const nftDescriptor: string = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // localhost

const committee = "0x52A76a606AC925f7113B4CC8605Fe6bCad431EbB";
// const committee = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // localhost

async function main() {

  const factoryNounsToken = await ethers.getContractFactory('NounsToken');
  const myNounsToken = await factoryNounsToken.deploy(committee, committee, nounsDescriptor, nounsSeeder, committee);
  await myNounsToken.deployed();
  console.log(`##NounsToken="${myNounsToken.address}"`);
  await runCommand(`npx hardhat verify ${myNounsToken.address} ${committee} ${committee} ${nounsDescriptor} ${nounsSeeder} ${committee} --network ${network.name} &`);

  const factoryAssetProvider = await ethers.getContractFactory('NounsAssetProviderV2');
  const assetProvider = await factoryAssetProvider.deploy(myNounsToken.address);
  await assetProvider.deployed();
  console.log(`##NounsAssetProviderV2="${assetProvider.address}"`);
  await runCommand(`npx hardhat verify ${assetProvider.address} ${myNounsToken.address} --network ${network.name} &`);

  const factorySnapshotStore = await ethers.getContractFactory('SnapshotStore');
  const snapshotStore = await factorySnapshotStore.deploy();
  await snapshotStore.deployed();
  console.log(`##SnapshotStore="${snapshotStore.address}"`);
  await runCommand(`npx hardhat verify ${snapshotStore.address} --network ${network.name} &`);

  const factoryPnounsProvider = await ethers.getContractFactory('PNounsProvider3');
  const pnounsProvider = await factoryPnounsProvider.deploy(font, assetProvider.address, snapshotStore.address, myNounsToken.address);
  await pnounsProvider.deployed();
  console.log(`##PNounsProvider3="${pnounsProvider.address}"`);
  await runCommand(`npx hardhat verify ${pnounsProvider.address} ${font} ${assetProvider.address} ${snapshotStore.address} ${myNounsToken.address} --network ${network.name} &`);

  const factoryPnounsPoap = await ethers.getContractFactory('PNounsPoapToken');
  const pnounsPoap = await factoryPnounsPoap.deploy(pnounsProvider.address, snapshotStore.address, myNounsToken.address, [committee]);
  await pnounsPoap.deployed();
  console.log(`##PNounsPoapToken="${pnounsPoap.address}"`);
  await runCommand('#★★★ tmp/PNounsPoapToken.ts に引数を指定★★★');
  await runCommand(`1: ${pnounsProvider.address} 2: ${snapshotStore.address} 3: ${myNounsToken.address} 4: ${committee}`);
  await runCommand(`npx hardhat verify ${pnounsPoap.address} --network ${network.name} --constructor-args tmp/PNounsPoapToken.ts &`);

  console.log(`##smyNounsToken.setMinter`);
  await myNounsToken.setMinter(pnounsPoap.address);

  await waitAndRun();
  console.log(`##pnounsPoap.startMint`);
  await pnounsPoap.startMint();

  await waitAndRun();
  await waitAndRun();
  console.log(`##pnounsPoap.adminMint`);
  const snapshot = {
    id: 100,
    title: "[Prop 306] SNP - SD Comic Con: Connecting a Cornucopia of Creators",
    choices: "[賛成,反対,棄権]",
    scores: "[120,11,3]",
    start: 1920003,
    end: 1930003
  }

  await pnounsPoap.adminMint([committee, committee, committee, committee, committee, committee],
    [1, 2, 3, 4, 5, 6], snapshot);

  await waitAndRun();
  console.log(`##pnounsPoap.adminMint2`);
  const snapshot2 = {
    id: 101,
    title: "[Prop 308] NounsFes2023",
    choices: "[賛成,反対,棄権]",
    scores: "[50,12,0]",
    start: 1920004,
    end: 1930004
  }
  await pnounsPoap.adminMint([committee, committee, committee, committee, committee, committee],
    [10, 20, 30, 40, 50, 60], snapshot2);

}

async function waitAndRun() {
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('5 seconds passed!');
}

waitAndRun();

async function runCommand(command: string) {
  if (network.name !== 'localhost') {
    console.log(command);
    console.log('');
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