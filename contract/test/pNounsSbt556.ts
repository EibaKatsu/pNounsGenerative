import { expect } from "chai";
import { ethers } from "hardhat";

let contractHelper: any;
let contractSplatter: any;
let contractArt: any;
let token: any;
let owner: any;
let authorized: any;
let authorized2: any;
let unauthorized: any;
let treasury: any;
let administrator: any;

before(async () => {

  [owner, authorized, authorized2, unauthorized, treasury, administrator] = await ethers.getSigners();

  const factoryHelper = await ethers.getContractFactory("SVGHelperA");
  contractHelper = await factoryHelper.deploy();
  await contractHelper.deployed();

  const factory = await ethers.getContractFactory("SplatterProvider");
  contractSplatter = await factory.deploy(contractHelper.address);
  await contractSplatter.deployed();

  const factoryArt = await ethers.getContractFactory("MultiplexProvider");
  contractArt = await factoryArt.deploy(contractSplatter.address, "spltart", "Splatter Art");
  await contractArt.deployed();

  const factoryToken2 = await ethers.getContractFactory("pNounsSBT556");
  token = await factoryToken2.deploy(contractArt.address, [administrator.address]);
  await token.deployed();

});

describe("pNounsSBT556 constant values", function () {
  it("contractHelper", async function () {
    const result = await contractHelper.functions.generateSVGPart(contractSplatter.address, 1);
    expect(result.tag).equal("splt1");
  });
  it("contractSplatter", async function () {
    const result = await contractSplatter.functions.generateSVGPart(1);
    expect(result.tag).equal("splt1");
  });
  it("mintLimit", async function () {
    const [mintLimit] = await token.functions.mintLimit();
    expect(mintLimit.toNumber()).equal(0);
    const tx = await token.setMintLimit(500);
    await tx.wait();
    const [mintLimit2] = await token.functions.mintLimit();
    expect(mintLimit2.toNumber()).equal(500);
  });
  it("mintPrice", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.02"));
    const halfPrice = mintPrice.div(ethers.BigNumber.from(2));
    const tx = await token.setMintPrice(halfPrice);
    await tx.wait();
    const [mintPrice2] = await token.functions.mintPrice();
    expect(mintPrice2).equal(halfPrice);
    const tx2 = await token.setMintPrice(mintPrice);
    await tx2.wait();
  });
});

it("normal pattern", async function () {
  const [mintPrice] = await token.functions.mintPrice();
  const [totalSupply] = await token.functions.totalSupply();

  // mint
  await token.connect(authorized).functions.mintPNouns( { value: mintPrice.mul(1) });

  const [count1] = await token.functions.balanceOf(authorized.address);
  expect(count1.toNumber()).equal(1);

  // pNounsTokenのtokenId=0のオーナー
  const [tokenOwner2] = await token.functions.ownerOf(ethers.BigNumber.from(1));
  expect(tokenOwner2).equal(authorized.address);

  const [count2] = await token.functions.totalSupply();
  expect(count2.toNumber()).equal(Number(totalSupply) + 1);

  // setApproveForAll
  await expect(token.connect(authorized).functions.setApprovalForAll(unauthorized.address, true))
    .to.be.revertedWith("This token is SBT.");

  // approve
  await expect(token.connect(authorized).functions.approve(unauthorized.address, 1))
    .to.be.revertedWith("This token is SBT.");

  // transfer
  await expect(token.connect(authorized).functions.transferFrom(authorized.address, unauthorized.address, 1))
    .to.be.revertedWith("This token is SBT, so this can not transfer.");

  // withdraw前
  var balance = await token.provider.getBalance(token.address);
  expect(balance).equal(mintPrice.mul(1));
  const balanceOfCostTo = await token.provider.getBalance(administrator.address);
  const balanceOfNounder1 = await token.provider.getBalance(treasury.address);
  const balanceOfNounder2 = await token.provider.getBalance(authorized.address);
  const balanceOfNounder3 = await token.provider.getBalance(authorized2.address);

  // withdraw

  // cost超過
  await expect(token.functions.withdraw([treasury.address, authorized.address, authorized2.address], administrator.address, balance))
    .to.be.revertedWith("cost is over balance");

  // 10%をコスト、その他を均等割
  const cost = balance.div(10);
  balance = balance.sub(cost);
  await token.functions.withdraw([treasury.address, authorized.address, authorized2.address], administrator.address, cost);

  // withdraw後
  const balanceOfCostTo2 = await token.provider.getBalance(administrator.address);
  const balanceOfNounder12 = await token.provider.getBalance(treasury.address);
  const balanceOfNounder22 = await token.provider.getBalance(authorized.address);
  const balanceOfNounder32 = await token.provider.getBalance(authorized2.address);
  expect(balanceOfCostTo2).equal(balanceOfNounder1.add(cost));
  expect(balanceOfNounder12).equal(balanceOfNounder1.add(balance.div(3)));
  expect(balanceOfNounder22).equal(balanceOfNounder2.add(balance.div(3)));
  expect(balanceOfNounder32).equal(balanceOfNounder3.add(balance.div(3)));

});

it("Multi mint OK", async function () {
  let tx, err;

  const [mintPrice] = await token.functions.mintPrice();

  // mint
  await token.connect(authorized).functions.mintPNouns({ value: mintPrice.mul(1) });

  const [count1] = await token.functions.balanceOf(authorized.address);
  expect(count1.toNumber()).equal(2);

  // 同じTokenIdで2回目ミント
  // mint
  await token.connect(authorized).functions.mintPNouns({ value: mintPrice.mul(1) });

  const [count2] = await token.functions.balanceOf(authorized.address);
  expect(count2.toNumber()).equal(3);

});

it("insufficient funds Error", async function () {
  let tx, err;

  const [mintPrice] = await token.functions.mintPrice();
  // mint 
  await expect(token.connect(unauthorized).functions.mintPNouns({ value: ethers.utils.parseEther("0.01")}))
    .to.be.revertedWith("insufficient funds");

});

it("sale is closed", async function () {
  let tx, err;

  await token.functions.setMintPrice(0);
  const [mintPrice] = await token.functions.mintPrice();
  expect(mintPrice).equal(0);
  // mint 
  await expect(token.connect(unauthorized).functions.mintPNouns({ value: mintPrice.mul(1) }))
    .to.be.revertedWith("sale is closed");

    await token.functions.setMintPrice(ethers.utils.parseEther("0.02"));

});

describe("owner transfer", function () {
  it("owner transfer", async function () {

    // オーナーの変更
    await token.functions.transferOwnership(treasury.address);

    // 旧オーナーで実行
    await expect(token.connect(owner).functions.setMintLimit(2000))
      .to.be.revertedWith("caller is not the admin");

    // 新オーナーで実行
    await token.connect(treasury).functions.setMintLimit(2000);
    const [limit] = await token.functions.mintLimit();
    expect(limit).equal(2000);
  })
});

describe("Support Interfaces Test", function () {
  const INTERFACE_IDS = {
    ERC165: "0x01ffc9a7",
    ERC721: "0x80ac58cd",
    ERC721Metadata: "0x5b5e139f",
    ERC721TokenReceiver: "0x150b7a02",
    ERC721Enumerable: "0x780e9d63",
    AccessControl: "0x7965db0b",
    ERC2981: "0x2a55205a",
  };

  it("ERC165", async function () {
    expect(await token.supportsInterface(INTERFACE_IDS.ERC165)).to.be.true;
  });
  it("ERC721", async function () {
    expect(await token.supportsInterface(INTERFACE_IDS.ERC721)).to.be.true;
  });
  it("ERC721Metadata", async function () {
    expect(await token.supportsInterface(INTERFACE_IDS.ERC721Metadata)).to
      .be.true;
  });
  it("AccessControl", async function () {
    expect(await token.supportsInterface(INTERFACE_IDS.AccessControl)).to.be
      .true;
  });
  it("ERC2981", async function () {
    expect(await token.supportsInterface(INTERFACE_IDS.ERC2981)).to.be.false;
  });
});
