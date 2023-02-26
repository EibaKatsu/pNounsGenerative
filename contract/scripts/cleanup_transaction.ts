import { ethers, network } from "hardhat";


async function main() {

    console.log("---------- [Clean up transaction] START ----------");
    const account = (await ethers.getSigners())[0];

    console.log(`network: ${network.name}`);
    console.log(`executor: ${account.address}`);
    console.log(`balance: ${ethers.utils.formatEther(await account.getBalance())}`);
    console.log(`nonce: ${await account.getTransactionCount()}`);

    let tx = {
        to: account.address,
        value: 1,  //ethers.utils.parseEther('1', 'wei')
        nonce: await account.getTransactionCount()
        // nonce: 336
    }

    const transaction = await account.sendTransaction(tx)
    const res = await transaction.wait()
    console.log(res)
    console.log(`new balance: ${ethers.utils.formatEther(await account.getBalance())}`)

    console.log("---------- [Clean up transaction] END ----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});