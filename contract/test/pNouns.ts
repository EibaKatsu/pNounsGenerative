import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

export const proxy = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";

let assetTokenGate: any;
let contractHelper: any;
let contractSplatter: any;
let testToken: any; // dummy token to test tokenGate
let contractArt: any;
let token: any;
let owner: any;
let authorized: any;
let unauthorized: any;
let treasury: any;

before(async () => {
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
  token = await factoryToken.deploy(contractArt.address, proxy);
  await token.deployed();

  [owner, authorized, unauthorized, treasury] = await ethers.getSigners();
});

const catchError = async (callback: any) => {
  try {
    await callback();
    console.log("unexpected success");
    return false;
  } catch (e: any) {
    return true;
  }
};

describe("pNounsToken constant values", function () {
  it("contractHelper", async function () {
    const result = await contractHelper.functions.generateSVGPart(contractSplatter.address, 1);
    expect(result.tag).equal("splt1");
  });
  it("contractSplatter", async function () {
    const result = await contractSplatter.functions.generateSVGPart(1);
    expect(result.tag).equal("splt1");
  });
  it("phase", async function () {
    await token.functions.setPhase(1, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
  });
  it("mintLimit", async function () {
    const [mintLimit] = await token.functions.mintLimit();
    expect(mintLimit.toNumber()).equal(2100);
    const tx = await token.setMintLimit(500);
    await tx.wait();
    const [mintLimit2] = await token.functions.mintLimit();
    expect(mintLimit2.toNumber()).equal(500);
    const tx2 = await token.setMintLimit(250);
    await tx2.wait();
  });
  it("mintPrice", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const halfPrice = mintPrice.div(ethers.BigNumber.from(2));
    const tx = await token.setMintPrice(halfPrice);
    await tx.wait();
    const [mintPrice2] = await token.functions.mintPrice();
    expect(mintPrice2).equal(halfPrice);
    const tx2 = await token.setMintPrice(mintPrice);
    await tx2.wait();
  });
  it("mintPriceFor", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    const [myMintPrice] = await token.functions.mintPriceFor(owner.address);
    expect(mintPrice).equal(myMintPrice);
  });
  it("MercleRoot", async function () {
    const tree = createTree([{ address: authorized.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());
    const [mercleRoot] = await token.functions.merkleRoot();
    expect(mercleRoot).equal(tree.getHexRoot());
  });
  it("maxMintPerAddress", async function () {
    const [maxMintPerAddress] = await token.functions.maxMintPerAddress();
    await token.functions.setMaxMintPerAddress(maxMintPerAddress.div(2));
    const [maxMintPerAddress2] = await token.functions.maxMintPerAddress();
    expect(maxMintPerAddress2).equal(maxMintPerAddress / 2);
  });
  it("treasuryAddress", async function () {
    await token.functions.setTreasuryAddress(treasury.address);
    const [treasury2] = await token.functions.treasuryAddress();
    expect(treasury2).equal(treasury.address);
  });
});

describe("pNounsToken preSale1", function () {
  it("set phase", async function () {
    await token.functions.setPhase(1, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
  });

  it("set phase", async function () {
    const [count] = await token.functions.totalSupply();
    expect(count.toNumber()).equal(0);
    const [mintPrice] = await token.functions.mintPrice();
    const tx = await token.functions.mint({ value: mintPrice });
    await tx.wait();
    const [count1] = await token.functions.balanceOf(owner.address);
    expect(count1.toNumber()).equal(1);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(1);
  });
  it("sold out error", async function () {
    const [count] = await token.functions.totalSupply();
    const tx = await token.setMintLimit(count);
    await tx.wait();
    const [mintPrice] = await token.functions.mintPrice();
    const err = await catchError(async () => {
      const tx2 = await token.functions.mint({ value: mintPrice });
      await tx2.wait();
    });
    expect(err).equal(true);

    const tx3 = await token.setMintLimit(250);
    await tx3.wait();
  });
  it("mint with wrong price", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    const halfPrice = mintPrice.div(ethers.BigNumber.from(2));
    const err = await catchError(async () => {
      const tx = await token.functions.mint({ value: halfPrice });
      await tx.wait();
    });
    expect(err).equal(true);
  });
  it("mint with whitelist token", async function () {
    const tx0 = await testToken.mint();
    await tx0.wait();

    const [mintPrice] = await token.functions.mintPrice();
    const halfPrice = mintPrice.div(ethers.BigNumber.from(2));
    const [myMintPrice] = await token.functions.mintPriceFor(owner.address);
    expect(myMintPrice).equal(halfPrice);

    const tx = await token.functions.mint({ value: halfPrice });
    await tx.wait();
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