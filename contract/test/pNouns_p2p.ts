import { expect } from "chai";
import { ethers, SignerWithAddress, Contract } from "hardhat";
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

let contractHelper: any;
let contractSplatter: any;
let contractArt: any;

let owner:SignerWithAddress, artist:SignerWithAddress, user1:SignerWithAddress, user2:SignerWithAddress, user3:SignerWithAddress, treasury:SignerWithAddress;
let token:Contract, token1:Contract, token2:Contract, token3:Contract;
let balanceO, balanceA, balance1, balance2, balance3;

before(async () => {
  [owner, artist, user1, user2, user3, treasury] = await ethers.getSigners();

  // const factory = await ethers.getContractFactory("SampleP2PToken");
  // token = await factory.deploy(artist.address);
  // await token.deployed();

  const factoryHelper = await ethers.getContractFactory("SVGHelperA");
  contractHelper = await factoryHelper.deploy();
  await contractHelper.deployed();

  const factory = await ethers.getContractFactory("SplatterProvider");
  contractSplatter = await factory.deploy(contractHelper.address);
  await contractSplatter.deployed();

  const factoryArt = await ethers.getContractFactory("MultiplexProvider");
  contractArt = await factoryArt.deploy(contractSplatter.address, "spltart", "Splatter Art");
  await contractArt.deployed();

  const factoryToken = await ethers.getContractFactory("pNounsToken");
  token = await factoryToken.deploy(contractArt.address, treasury.address, [treasury.address]);
  await token.deployed();


  token1 = token.connect(user1);
  token2 = token.connect(user2);
  token3 = token.connect(user3);
});

describe("P2P", function () {
  let result, tx, err, balance;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const price = ethers.BigNumber.from("1000000000000000");
  const tokenId0 = 101;
  console.log(ethers.utils.formatEther(price));

  it("Initial TotalSupply", async function() {
    result = await token.totalSupply();
    expect(result.toNumber()).equal(100);
    result = await token.balanceOf(user1.address);
    expect(result.toNumber()).equal(0);
  });

  it("Mint by user1", async function() {
    await token.functions.setPhase(2, 1); // phase:SalePhase.PUblicSale, purchaceUnit:1
    const [mintPrice] = await token.functions.mintPrice();

    // user1を含むマークルツリー
    const tree = createTree([{ address: user1.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // user1のマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [user1.address]));

    // 購入単位でmint
    await token.connect(user1).functions.mintPNouns(1, proof, { value: mintPrice.mul(1) });
    // await tx.wait();

    // tx = await token1.mint();
    // await tx.wait();
    result = await token.totalSupply();
    expect(result.toNumber()).equal(101);
    result = await token.balanceOf(user1.address);
    expect(result.toNumber()).equal(1);
    result = await token.ownerOf(tokenId0);
    expect(result).equal(user1.address);
    result = await token.getPriceOf(tokenId0);
    expect(result.toNumber()).equal(0);
  });
  it("Attempt to buy by user2", async function() {
    await expect(token2.purchase(tokenId0, user2.address, zeroAddress)).revertedWith("Token is not on sale");
  });
  it("SetPrice", async function() {
    await expect(token2.setPriceOf(tokenId0, price)).revertedWith("Only the onwer can set the price");
    tx = await token1.setPriceOf(tokenId0, price);
    await tx.wait();
    result = await token.getPriceOf(tokenId0);
    expect(result.toNumber()).equal(price);
  });
  it("Purchase by user2", async function() {

    // pNounsMarketplaceに user2 を追加
    await token.setPNounsMarketplace(user2.address, true);

    await expect(token2.purchase(tokenId0, user2.address, zeroAddress)).revertedWith('Not enough fund');

    balance1 = await token.etherBalanceOf(user1.address);
    balanceA = await token.etherBalanceOf(artist.address);

    tx = await token2.purchase(tokenId0, user2.address, zeroAddress, {value:price});
    await tx.wait();
    result = await token.ownerOf(tokenId0);
    expect(result).equal(user2.address);

    balance = await token.etherBalanceOf(user1.address);
    expect(balance.sub(balance1)).equal(price.div(10).mul(9)); // 90%
    balance = await token.etherBalanceOf(artist.address);
    expect(balance.sub(balanceA)).equal(0); // 0%
  });
  it("Attempt to buy by user3", async function() {
    await expect(token3.purchase(0, user2.address, zeroAddress, {value: price})).revertedWith("Token is not on sale");
  });
});


/**
 * https://github.com/Lavulite/ERC721MultiSale/blob/main/utils/merkletree.ts より
 */
 type Node = {
  address: string,
  // allowedAmount: number
}

const createTree = (allowList: Node[]) => {
  // const leaves = allowList.map(node => ethers.utils.solidityKeccak256(['address', 'uint256'], [node.address, node.allowedAmount]))
  const leaves = allowList.map(node => ethers.utils.solidityKeccak256(['address'], [node.address]))
  return new MerkleTree(leaves, keccak256, { sortPairs: true })
}