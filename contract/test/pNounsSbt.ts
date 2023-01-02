import { expect } from "chai";
import { ethers } from "hardhat";

let contractHelper: any;
let contractSplatter: any;
let contractArt: any;
let pnouns: any;
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

  const factoryToken = await ethers.getContractFactory("pNounsToken");
  pnouns = await factoryToken.deploy(contractArt.address, [administrator.address]);
  await pnouns.deployed();

  const factoryToken2 = await ethers.getContractFactory("pNounsSBT");
  token = await factoryToken2.deploy(contractArt.address, pnouns.address, [administrator.address]);
  await token.deployed();

});

describe("pNounsSBT constant values", function () {
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
    expect(mintLimit.toNumber()).equal(2100);
    const tx = await token.setMintLimit(500);
    await tx.wait();
    const [mintLimit2] = await token.functions.mintLimit();
    expect(mintLimit2.toNumber()).equal(500);
  });
  it("mintPrice", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.01"));
    const halfPrice = mintPrice.div(ethers.BigNumber.from(2));
    const tx = await token.setMintPrice(halfPrice);
    await tx.wait();
    const [mintPrice2] = await token.functions.mintPrice();
    expect(mintPrice2).equal(halfPrice);
    const tx2 = await token.setMintPrice(mintPrice);
    await tx2.wait();
  });
  it("treasuryAddress", async function () {
    await token.functions.setTreasuryAddress(treasury.address);
    const [treasury2] = await token.functions.treasuryAddress();
    expect(treasury2).equal(treasury.address);
  });
});

it("normal pattern", async function () {
  const [mintPrice] = await token.functions.mintPrice();
  const [totalSupply] = await token.functions.totalSupply();

  // adminMintで authorized へミント
  await pnouns.connect(owner).functions.adminMint([authorized.address], [1]);

  // pNounsTokenのtokenId=101のオーナー
  const [tokenOwner] = await pnouns.functions.ownerOf(101);
  expect(tokenOwner).equal(authorized.address);

  // mint
  await token.connect(authorized).functions.mintPNouns([101], { value: mintPrice.mul(1) });

  const [count1] = await token.functions.balanceOf(authorized.address);
  expect(count1.toNumber()).equal(1);

  // pNounsTokenのtokenId=101のオーナー
  const [tokenOwner2] = await token.functions.ownerOf(ethers.BigNumber.from(101));
  expect(tokenOwner2).equal(authorized.address);

  const [count2] = await token.functions.totalSupply();
  expect(count2.toNumber()).equal(Number(totalSupply) + 1);

  // setApproveForAll
  await expect(token.connect(authorized).functions.setApprovalForAll(unauthorized.address, true))
  .to.be.revertedWith("This token is SBT.");

  // approve
  await expect(token.connect(authorized).functions.approve(unauthorized.address, 101))
  .to.be.revertedWith("This token is SBT.");

  // transfer
  await expect(token.connect(authorized).functions.transferFrom(authorized.address, unauthorized.address, 101))
  .to.be.revertedWith("This token is SBT, so this can not transfer.");

});

it("Multi mint Error", async function () {
  let tx, err;

  const [mintPrice] = await token.functions.mintPrice();
  
  // adminMintで authorized へミント
  await pnouns.connect(owner).functions.adminMint([authorized.address], [1]);

  // pNounsTokenのtokenId=102のオーナー
  const [tokenOwner] = await pnouns.functions.ownerOf(102);
  expect(tokenOwner).equal(authorized.address);

  // mint
  await token.connect(authorized).functions.mintPNouns([102], { value: mintPrice.mul(1) });

  const [count1] = await token.functions.balanceOf(authorized.address);
  expect(count1.toNumber()).equal(2);

  // 同じTokenIdで2回目ミント
  await expect(token.connect(authorized).functions.mintPNouns([102], { value: mintPrice.mul(1) }))
    .to.be.revertedWith("ERC721: token already minted");

});

it("Non pNouns Owner Error", async function () {
  let tx, err;

  const [mintPrice] = await token.functions.mintPrice();
  // pNounsTokenのtokenId=2のオーナー
  const [tokenOwner] = await pnouns.functions.ownerOf(ethers.BigNumber.from(2));
  expect(tokenOwner).equal("0x8AE80e0B44205904bE18869240c2eC62D2342785");

  // mint オーナーでないunauthorizedユーザで実行
  await expect(token.connect(unauthorized).functions.mintPNouns([2], { value: mintPrice.mul(1) }))
    .to.be.revertedWith("sender is not the owner of this token.");

});

it("insufficient funds Error", async function () {
  let tx, err;

  const [mintPrice] = await token.functions.mintPrice();
  // mint オーナーでないunauthorizedユーザで実行
  await expect(token.connect(unauthorized).functions.mintPNouns([1,2,3,4], { value: mintPrice.mul(3) }))
    .to.be.revertedWith("insufficient funds");

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
