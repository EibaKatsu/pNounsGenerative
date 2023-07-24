import { ethers, network } from 'hardhat';
import { exec } from 'child_process';
import addresses from '@nouns/sdk/dist/contract/addresses.json';
import { BigNumber } from 'ethers';

// const nounsDescriptor: string = network.name == 'goerli' ? addresses[5].nounsDescriptor : addresses[1].nounsDescriptor;
// const nounsSeeder: string = network.name == 'goerli' ? addresses[5].nounsSeeder : addresses[1].nounsSeeder;
// const nftDescriptor: string = network.name == 'goerli' ? addresses[5].nftDescriptor : addresses[1].nftDescriptor;

// const pnounsPoap: string = '0x6993b19a64bbb8d970c912ee665f9bee11c23929';  // mumbai
// const nounsDescriptor: string = '0x3578311a15f23a290ED8CAE2ed3DA096a6F9d943'; // mumbai
// const nounsSeeder: string = '0x7b7Ea6Ab721E8d56De64d959188a45DFf26C395f'; // mumbai
// const committee = "0x52A76a606AC925f7113B4CC8605Fe6bCad431EbB";  // mumbai

const pnounsPoap: string = '0xEA059a8EAF102499C77D5BfD00FEFf56E4974b67';  // polygon
const nounsDescriptor: string = '0x3578311a15f23a290ED8CAE2ed3DA096a6F9d943'; // polygon
const nounsSeeder: string = '0x7b7Ea6Ab721E8d56De64d959188a45DFf26C395f'; // polygon
const committee = "0x4e06186A2C78986BB478A4dC4aB3FF3918937627"; // polygon

async function main() {

  const factoryNounsToken = await ethers.getContractFactory('NounsToken');
  const myNounsToken = await factoryNounsToken.deploy(committee, committee, nounsDescriptor, nounsSeeder);
  await myNounsToken.deployed();
  console.log(`##NounsToken="${myNounsToken.address}"`);
  await runCommand(`npx hardhat verify ${myNounsToken.address} ${committee} ${committee} ${nounsDescriptor} ${nounsSeeder} --network ${network.name} &`);

  await waitAndRun();
  console.log(`##pnounsPoap.mint 0`);
  await myNounsToken.mint();

  await waitAndRun();
  console.log(`##pnounsPoap.mint 1`);
  await myNounsToken.mint();

  await waitAndRun();
  console.log(`##myNounsToken.setMinter`);
  await myNounsToken.setMinter(pnounsPoap);



  
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