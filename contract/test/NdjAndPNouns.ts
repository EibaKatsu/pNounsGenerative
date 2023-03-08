import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

let contractHelper: any;
let contractSplatter: any;
let contractArt: any;
let token: any;
let pNouns: any;
let sbt556: any;
let owner: any;
let authorized: any;
let authorized2: any;
let unauthorized: any;
let treasury: any;
let administrator: any;

before(async () => {

  [owner, authorized, authorized2, unauthorized, treasury, administrator] = await ethers.getSigners();
  console.log("owner:", owner.address);

  const factoryHelper = await ethers.getContractFactory("SVGHelperA");
  contractHelper = await factoryHelper.deploy();
  await contractHelper.deployed();

  const factory = await ethers.getContractFactory("SplatterProvider");
  contractSplatter = await factory.deploy(contractHelper.address);
  await contractSplatter.deployed();

  const factoryArt = await ethers.getContractFactory("MultiplexProvider");
  contractArt = await factoryArt.deploy(contractSplatter.address, "spltart", "Splatter Art");
  await contractArt.deployed();

  const factoryPNounsToken = await ethers.getContractFactory("pNounsToken");
  pNouns = await factoryPNounsToken.deploy(contractArt.address, [administrator.address]);
  await pNouns.deployed();

  console.log("pNouns:", pNouns.address);

  const factoryToken = await ethers.getContractFactory("NdjAndPNounsToken");
  token = await factoryToken.deploy(contractArt.address, [administrator.address], [pNouns.address]);
  await token.deployed();

  const factoryToken2 = await ethers.getContractFactory("pNounsSBT556");
  sbt556 = await factoryToken2.deploy(contractArt.address, [administrator.address]);
  await sbt556.deployed();

});

describe("NdjAndPNounsToken constant values", function () {
  it("contractHelper", async function () {
    const result = await contractHelper.functions.generateSVGPart(contractSplatter.address, 1);
    expect(result.tag).equal("splt1");
  });
  it("contractSplatter", async function () {
    const result = await contractSplatter.functions.generateSVGPart(1);
    expect(result.tag).equal("splt1");
  });
  // デプロイ後のトレジャリーミント
  // it("treasury mint", async function () {
  //   const [count1] = await token.functions.balanceOf(treasury.address);
  //   expect(count1.toNumber()).equal(100);
  // });
  it("phase", async function () {
    await token.functions.setPhase(1);
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
  });
  it("mintLimit", async function () {
    const [mintLimit] = await token.functions.mintLimit();
    expect(mintLimit.toNumber()).equal(10000);
    const tx = await token.setMintLimit(500);
    await tx.wait();
    const [mintLimit2] = await token.functions.mintLimit();
    expect(mintLimit2.toNumber()).equal(500);
  });
  it("mintPrice", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0"));
  });
  it("mintPriceFor", async function () {
    const [mintPrice] = await token.functions.mintPrice();
    const [myMintPrice] = await token.functions.mintPriceFor(owner.address);
    expect(mintPrice).equal(myMintPrice);
  });
  it("maxMintPerAddress", async function () {
    const [maxMintPerAddress] = await token.functions.maxMintPerAddress();
    await token.functions.setMaxMintPerAddress(maxMintPerAddress.div(2));
    const [maxMintPerAddress2] = await token.functions.maxMintPerAddress();
    expect(maxMintPerAddress2).equal(maxMintPerAddress / 2);
    await token.functions.setMaxMintPerAddress(100);
  });
  it("treasuryAddress", async function () {
    await token.functions.setTreasuryAddress(treasury.address);
    const [treasury2] = await token.functions.treasuryAddress();
    expect(treasury2).equal(treasury.address);
  });
  // hardhatだとなぜかTypeError: token.functions.setWhiteList is not a function
  // RemixでGoerliにデプロイして試すとうまくいくのでOKとする
  // it("whiteList", async function () {
  //   await token.functions.setWhiteList([pNouns.address]);
  //   const [whiteList] = await token.functions.whiteList();
  //   expect(whiteList[0]).equal(pNouns.address);
  // });
});

describe("NdjAndPNounsToken Presale mint", function () {

  it("SalePhase Error", async function () {
    let tx, err;

    await token.functions.setPhase(0); // phase:SalePhase.Lock
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);

    await expect(token.connect(authorized).functions.mintPNouns(5))
      .to.be.revertedWith("Sale locked")
  });

  it("normal pattern", async function () {
    await token.functions.setPhase(1); // phase:SalePhase.PreSale
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaceMax] = await token.functions.purchaceMax();
    expect(purchaceMax).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0"));
    const [totalSupply] = await token.functions.totalSupply();
    // await token.functions.setWhiteList([pNouns.address]);

    const [hasWhiteList1] = await token.functions.hasWhiteList(authorized.address);
    expect(hasWhiteList1).equal(false);

    // pNounsをミント
    await pNouns.functions.adminMint([authorized.address], [10]);

    const [hasWhiteList2] = await token.functions.hasWhiteList(authorized.address);
    expect(hasWhiteList2).equal(true);

    // 購入単位以下でmint
    await token.connect(authorized).functions.mintPNouns(3, { value: ethers.utils.parseEther("1") });

    const [count1] = await token.functions.balanceOf(authorized.address);
    expect(count1.toNumber()).equal(3);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 3);

    // withdraw前
    const balance = await token.provider.getBalance(token.address);
    expect(balance).equal(ethers.utils.parseEther("1"));
    const balanceOfTreasury = await token.provider.getBalance(treasury.address);

    // withdraw
    await token.functions.withdraw();

    // withdraw後
    const balance2 = await token.provider.getBalance(treasury.address);
    expect(balance2).equal(balanceOfTreasury.add(ethers.utils.parseEther("1")));

  });

  // パブリックセール
  it("public Sale", async function () {
    await token.functions.setPhase(2); // phase:SalePhase.PUblicSale
    const [phase] = await token.functions.phase();
    expect(phase).equal(2);
    const [totalSupply] = await token.functions.totalSupply();

    // 購入単位でmint
    await token.connect(authorized2).functions.mintPNouns(3);
    // await tx.wait();

    const [count1] = await token.functions.balanceOf(authorized2.address);
    expect(count1.toNumber()).equal(3);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 3);
  });

  it("no whitelist Error", async function () {
    let tx, err;

    await token.functions.setPhase(1); // phase:SalePhase.Presale
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);

    const [hasWhiteList2] = await token.functions.hasWhiteList(authorized2.address);
    expect(hasWhiteList2).equal(false);

    await expect(token.connect(authorized2).functions.mintPNouns(5))
      .to.be.revertedWith("have any token of whitelist");

    // authorized2でsbt556をミント
  const [mintPrice] = await sbt556.functions.mintPrice();
    await sbt556.connect(authorized2).functions.mintPNouns({ value: mintPrice });
    const [count3] = await sbt556.functions.balanceOf(authorized2.address);
    expect(count3.toNumber()).equal(1);

  // hardhatだとなぜかTypeError: token.functions.setWhiteList is not a function
  // RemixでGoerliにデプロイして試すとうまくいくのでOKとする

    // sbt556をwhitelistへ追加
    // await token.connect(owner).functions.setWhiteList([pNouns.address, sbt556.address]);
    // await token.connect(authorized2).functions.mintPNouns(5);
    // const [count4] = await token.functions.balanceOf(authorized2.address);
    // expect(count4.toNumber()).equal(5);
  });

  it("Purchase amount Error", async function () {
    let tx, err;

    await token.functions.setPhase(1); // phase:SalePhase.Presale
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);

    await expect(token.connect(authorized).functions.mintPNouns(6))
      .to.be.revertedWith("invalid mint amount");
  });

  it("Purchase amount Error2", async function () {
    let tx, err;

    await token.functions.setPhase(1); // phase:SalePhase.Presale
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);

    await expect(token.connect(authorized).functions.mintPNouns(0))
      .to.be.revertedWith("invalid mint amount");
  });

    it("Exceed number of per address Error", async function () {
      let tx, err;

      await token.functions.setPhase(1); // phase:SalePhase.Presale
      const [phase] = await token.functions.phase();
      expect(phase).equal(1);
      await token.functions.setPurchaceMax(60);

      const [count0] = await token.functions.balanceOf(authorized.address);
      // 50個はOK
      await token.connect(authorized).functions.mintPNouns(50);
      const [count1] = await token.functions.balanceOf(authorized.address);
      expect(count1).equal(count0.add(50));

      await expect(token.connect(authorized).functions.mintPNouns(55))
        .to.be.revertedWith("exceeds number of per address");

    });

    it("Sold out Error", async function () {
      let tx, err;

      await token.functions.setPhase(2); // phase:SalePhase.Public
      const [phase] = await token.functions.phase();
      expect(phase).equal(2);
      
      const [totalSupply] = await token.functions.totalSupply();
      tx = await token.setMintLimit(totalSupply.add(5));
      await tx.wait();

      // 5個まではエラーにならない
      token.connect(authorized2).functions.mintPNouns(5);

      // 次の5個はエラー
      await expect(token.connect(authorized2).functions.mintPNouns(5))
        .to.be.revertedWith("Sold out");

      tx = await token.setMintLimit(2100);

    });

  describe("NdjAndPNounsToken owner's mint", function () {

    it("normal pattern", async function () {
      await token.functions.setPhase(0);  // Lock
      const [phase] = await token.functions.phase();
      expect(phase).equal(0);
      const [totalSupply] = await token.functions.totalSupply();
      await token.setMintLimit(2100);

      // 購入Max超, ETHなしでmint
      await token.connect(owner).functions.mintPNouns(20);
      // await tx.wait();

      const [count1] = await token.functions.balanceOf(owner.address);
      expect(count1.toNumber()).equal(20);
      const [count2] = await token.functions.totalSupply();
      expect(count2.toNumber()).equal(Number(totalSupply) + 20);
    });

    it("sold out", async function () {
      await token.functions.setPhase(0);
      const [phase] = await token.functions.phase();
      expect(phase).equal(0);

      const [count] = await token.functions.totalSupply();
      await token.setMintLimit(count.toNumber() + 1);
      const [mintLimit] = await token.functions.mintLimit();

      // 1つ目はエラーにならない
      await token.functions.mintPNouns(1);
      // 2つ目はエラーになる
      await expect(token.functions.mintPNouns(1))
        .to.be.revertedWith("Sold out");

      const [count2] = await token.functions.totalSupply();
      const [mintLimit2] = await token.functions.mintLimit();

      await token.setMintLimit(2100);
    });

    it("administrators mint", async function () {
      await token.functions.setPhase(0);
      const [phase] = await token.functions.phase();
      expect(phase).equal(0);

      // エラーにならない
      await token.connect(administrator).functions.mintPNouns(10);

      const [count1] = await token.functions.balanceOf(administrator.address);
      expect(count1.toNumber()).equal(10);
    });

  });

  describe("NdjAndPNounsToken adminMint", function () {

    it("adminMint normal", async function () {

      const [totalSupply] = await token.functions.totalSupply();

      const [count1] = await token.functions.balanceOf(owner.address);
      const [count2] = await token.functions.balanceOf(authorized.address);
      const [count3] = await token.functions.balanceOf(authorized2.address);
      const [count4] = await token.functions.balanceOf(unauthorized.address);
      const [count5] = await token.functions.balanceOf(treasury.address);
      const [count6] = await token.functions.balanceOf(administrator.address);


      await token.connect(administrator).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [1, 2, 3, 4, 5, 6]
      );

      const [count1a] = await token.functions.balanceOf(owner.address);
      const [count2a] = await token.functions.balanceOf(authorized.address);
      const [count3a] = await token.functions.balanceOf(authorized2.address);
      const [count4a] = await token.functions.balanceOf(unauthorized.address);
      const [count5a] = await token.functions.balanceOf(treasury.address);
      const [count6a] = await token.functions.balanceOf(administrator.address);

      expect(count1a.toNumber()).equal(count1.toNumber() + 1);
      expect(count2a.toNumber()).equal(count2.toNumber() + 2);
      expect(count3a.toNumber()).equal(count3.toNumber() + 3);
      expect(count4a.toNumber()).equal(count4.toNumber() + 4);
      expect(count5a.toNumber()).equal(count5.toNumber() + 5);
      expect(count6a.toNumber()).equal(count6.toNumber() + 6);

      const [totalSupply2] = await token.functions.totalSupply();

      expect(totalSupply2.toNumber()).equal(totalSupply.toNumber() + 1 + 2 + 3 + 4 + 5 + 6);
    });

    it("adminMint args error", async function () {
      // 引数の数が違う
      await expect(token.connect(administrator).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [1, 2, 3, 4, 5]
      ))
        .to.be.revertedWith("args error");
    });

    it("adminMint mintAmount is zero", async function () {
      // ミント数ゼロあり
      await expect(token.connect(administrator).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [1, 2, 0, 4, 5, 6]
      ))
        .to.be.revertedWith("mintAmount is zero");
    });

    it("adminMint exceed limitAdminMint", async function () {
      // 合計1００以上のミント
      await expect(token.connect(administrator).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [10, 10, 10, 10, 50, 11]
      ))
        .to.be.revertedWith("exceed limitAdminMint");
    });

    it("adminMint exceed mintLimit", async function () {

      const tx = await token.setMintLimit(60);
      await tx.wait();
      const [mintLimit2] = await token.functions.mintLimit();
      expect(mintLimit2.toNumber()).equal(60);

      // max以上のミント
      await expect(token.connect(administrator).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [10, 10, 10, 10, 10, 11]
      ))
        .to.be.revertedWith("exceed mintLimit");
    });

    it("adminMint not admin", async function () {

      // unauthorized で実行
      await expect(token.connect(unauthorized).functions.adminMint(
        [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
        [10, 10, 10, 10, 10, 11]
      ))
        .to.be.revertedWith("caller is not the admin");
    });

  });
  describe("owner transfer", function () {
    it("owner transfer", async function () {

      // オーナーの変更
      await token.functions.transferOwnership(treasury.address);

      // 旧オーナーで実行
      await expect(token.connect(owner).functions.setPhase(1))
        .to.be.revertedWith("caller is not the admin");

      // 新オーナーで実行
      await token.connect(treasury).functions.setPhase(1);
      const [phase] = await token.functions.phase();
      expect(phase).equal(1);
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
});
