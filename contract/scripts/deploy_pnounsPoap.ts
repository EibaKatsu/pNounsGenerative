import { ethers, network } from 'hardhat';
import { exec } from 'child_process';
import addresses from '@nouns/sdk/dist/contract/addresses.json';
import { BigNumber } from 'ethers';

// const nounsDescriptor: string = network.name == 'goerli' ? addresses[5].nounsDescriptor : addresses[1].nounsDescriptor;
// const nounsSeeder: string = network.name == 'goerli' ? addresses[5].nounsSeeder : addresses[1].nounsSeeder;
// const nftDescriptor: string = network.name == 'goerli' ? addresses[5].nftDescriptor : addresses[1].nftDescriptor;

const font: string = '0x1183F445E209051ecB8f0c062153F2b2110F806A';  // polygon
const nounsDescriptor: string = '0x3578311a15f23a290ED8CAE2ed3DA096a6F9d943'; // polygon
const nounsSeeder: string = '0x7b7Ea6Ab721E8d56De64d959188a45DFf26C395f'; // polygon
const nftDescriptor: string = '0x6d4e0525D491b71ff1897482A8Cf59FbB5F2599c'; // polygon

// const nounsDescriptor: string = '0x6Ad5B8B5a12a26892C6Ad6b8Ae64905D9B53da8A'; // localhost
// const nounsSeeder: string = '0x941Ed50A3B5eCaCB6e0985886fc5ACBc5CC2ae8C'; // localhost
// const nftDescriptor: string = '0x4DCD10c8Da99C062E06dc28f7a26917B3D45dC73'; // localhost
// const font: string = '0x15cAbd0536f9707d1c03b21dDdC556726D7FF136';  // mumbai

// const committee = "0x52A76a606AC925f7113B4CC8605Fe6bCad431EbB";  // test
const committee = "0x4e06186a2c78986bb478a4dc4ab3ff3918937627"; // polygon

async function main() {

  const factoryNounsToken = await ethers.getContractFactory('NounsToken');
  const myNounsToken = await factoryNounsToken.deploy(committee, committee, nounsDescriptor, nounsSeeder);
  await myNounsToken.deployed();
  console.log(`##NounsToken="${myNounsToken.address}"`);
  await runCommand(`npx hardhat verify ${myNounsToken.address} ${committee} ${committee} ${nounsDescriptor} ${nounsSeeder} --network ${network.name} &`);

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

  console.log(`##myNounsToken.setMinter`);
  await myNounsToken.setMinter(pnounsPoap.address);

  console.log(`##snapshotStore.setMinter`);
  await snapshotStore.setMinter(pnounsPoap.address);

  await waitAndRun();
  console.log(`##pnounsPoap.startMint`);
  await pnounsPoap.startMint();

  await waitAndRun();

  const snapshot = {
    id: 100,
    title: "One Noun, Every Vote.",
    choices: "type",
    scores: "the first poap",
    start: 0,
    end: 0
  }
  // console.log(`##snapshotStore.registor`);
  // var snapshotIndex = await snapshotStore.register(snapshot);
  // var snapshotIndex2 = ethers.BigNumber.from(snapshotIndex.value);
  // console.log("snapshotIndex", snapshotIndex2);

  await waitAndRun();
  console.log(`##pnounsPoap.adminMint`);
  await pnounsPoap.adminMint([committee], [21], snapshot);


  // await waitAndRun();
  // console.log(`##pnounsPoap.tokenURI`);
  // console.log(await pnounsPoap.tokenURI(3));

  
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