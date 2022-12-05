import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

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

  const factoryToken = await ethers.getContractFactory("pNounsToken");
  token = await factoryToken.deploy(contractArt.address, treasury.address, [administrator.address]);
  await token.deployed();

});

describe("pNounsToken constant values", function () {
  it("contractHelper", async function () {
    const result = await contractHelper.functions.generateSVGPart(contractSplatter.address, 1);
    expect(result.tag).equal("splt1");
  });
  it("contractSplatter", async function () {
    const result = await contractSplatter.functions.generateSVGPart(1);
    expect(result.tag).equal("splt1");
  });
  // デプロイ後のトレジャリーミント
  it("treasury mint", async function () {
    const [count1] = await token.functions.balanceOf(treasury.address);
    expect(count1.toNumber()).equal(100);
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
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());
    const [mercleRoot] = await token.functions.merkleRoot();
    expect(mercleRoot).equal(tree.getHexRoot());
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
});

describe("pNounsToken Presale mint", function () {

  it("SalePhase Error", async function () {
    let tx, err;

    await token.functions.setPhase(0, 5); // phase:SalePhase.Lock, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [unauthorized.address]));

    const [mintPrice] = await token.functions.mintPrice();

    await expect(token.connect(authorized).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) }))
      .to.be.revertedWith("Sale locked")

  });

  it("normal pattern", async function () {
    await token.functions.setPhase(1, 5); // phase:SalePhase.PreSale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const [totalSupply] = await token.functions.totalSupply();

    // authorizedを含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorizedのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized.address]));

    // 購入単位でmint
    await token.connect(authorized).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) });
    // await tx.wait();

    const [count1] = await token.functions.balanceOf(authorized.address);
    expect(count1.toNumber()).equal(5);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 5);

    // withdraw前
    const balance = await token.provider.getBalance(token.address);
    expect(balance).equal(mintPrice.mul(5));
    const balanceOfTreasury = await token.provider.getBalance(treasury.address);

    // withdraw
    await token.functions.withdraw();

    // withdraw後
    const balance2 = await token.provider.getBalance(treasury.address);
    expect(balance2).equal(balanceOfTreasury.add(mintPrice.mul(5)));

  });

  it("normal pattern", async function () {
    await token.functions.setPhase(1, 5); // phase:SalePhase.PreSale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const [totalSupply] = await token.functions.totalSupply();

    // authorizedを含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorizedのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized.address]));

    const [count0] = await token.functions.balanceOf(authorized.address);

    // 購入単位でmint
    await token.connect(authorized).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) });
    // await tx.wait();

    const [count1] = await token.functions.balanceOf(authorized.address);
    expect(count1.toNumber()).equal(count0.toNumber() + 5);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 5);

    // withdraw前
    const balance = await token.provider.getBalance(token.address);
    expect(balance).equal(mintPrice.mul(5));
    const balanceOfTreasury = await token.provider.getBalance(treasury.address);

    // withdraw
    await token.functions.withdraw();

    // withdraw後
    const balance2 = await token.provider.getBalance(treasury.address);
    expect(balance2).equal(balanceOfTreasury.add(mintPrice.mul(5)));

  });

  // パブリックセール
  it("public Sale", async function () {
    await token.functions.setPhase(2, 1); // phase:SalePhase.PUblicSale, purchaceUnit:1
    const [phase] = await token.functions.phase();
    expect(phase).equal(2);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(1)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const [totalSupply] = await token.functions.totalSupply();

    // authorized2を含まないマークルツリー
    const tree = createTree([{ address: authorized.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorized2のマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized2.address]));

    // 購入単位でmint
    await token.connect(authorized2).functions.mintPNouns(3, proof, { value: mintPrice.mul(3) });
    // await tx.wait();

    const [count1] = await token.functions.balanceOf(authorized2.address);
    expect(count1.toNumber()).equal(3);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 3);
  });

  it("Purchase Unit Error", async function () {
    let tx, err;

    await token.functions.setPhase(1, 5); // phase:SalePhase.Presale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorizedのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized.address]));

    const [mintPrice] = await token.functions.mintPrice();

    await expect(token.connect(authorized).functions.mintPNouns(7, proof, { value: mintPrice.mul(7) }))
      .to.be.revertedWith("Invalid purchaseUnit");
  });

  it("Purchase Unit Error2", async function () {
    let tx, err;

    await token.functions.setPhase(1, 5); // phase:SalePhase.Presale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorizedのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized.address]));

    const [mintPrice] = await token.functions.mintPrice();

    await expect(token.connect(authorized).functions.mintPNouns(0, proof, { value: mintPrice.mul(7) }))
      .to.be.revertedWith("Invalid purchaseUnit");

  });

  it("Exceed number of per address Error", async function () {
    let tx, err;

    await token.functions.setPhase(1, 5); // phase:SalePhase.Presale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized.address]));

    const [mintPrice] = await token.functions.mintPrice();

    const [count0] = await token.functions.balanceOf(authorized.address);
    // 50個はOK
    await token.connect(authorized).functions.mintPNouns(50, proof, { value: mintPrice.mul(50) });
    const [count1] = await token.functions.balanceOf(authorized.address);
    expect(count1).equal(count0.add(50));

    await expect(token.connect(authorized).functions.mintPNouns(55, proof, { value: mintPrice.mul(55) }))
      .to.be.revertedWith("exceeds number of per address");

  });

  it("insufficient funds Error", async function () {
    let tx, err;

    await token.functions.setPhase(1, 5); // phase:SalePhase.Presale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // authorizedのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized2.address]));

    const [mintPrice] = await token.functions.mintPrice();

    await expect(token.connect(authorized2).functions.mintPNouns(5, proof, { value: mintPrice.mul(4) }))
      .to.be.revertedWith('insufficient funds');

  });

  it("Merkle Error", async function () {
    let tx, err;

    // unauthorized を含まないマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [unauthorized.address]));

    const [mintPrice] = await token.functions.mintPrice();

    await expect(token.connect(unauthorized).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) }))
      .to.be.revertedWith("Invalid Merkle Proof");

  });

  it("Sold out Error", async function () {
    let tx, err;

    await token.functions.setPhase(1, 5); // phase:SalePhase.Presale, purchaceUnit:5 
    const [phase] = await token.functions.phase();
    expect(phase).equal(1);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)

    // authorized を含むマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [authorized2.address]));

    const [mintPrice] = await token.functions.mintPrice();

    const [totalSupply] = await token.functions.totalSupply();
    tx = await token.setMintLimit(totalSupply.add(5));
    await tx.wait();

    // 5個まではエラーにならない
    token.connect(authorized2).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) });

    // 次の5個はエラー
    await expect(token.connect(authorized2).functions.mintPNouns(5, proof, { value: mintPrice.mul(5) }))
      .to.be.revertedWith("Sold out");

    tx = await token.setMintLimit(2100);

  });

});
describe("pNounsToken owner's mint", function () {

  it("normal pattern", async function () {
    await token.functions.setPhase(0, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const [totalSupply] = await token.functions.totalSupply();
    await token.setMintLimit(2100);

    // ownerを含まないマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [owner.address]));

    // 購入単位以外, ETHなしでmint
    await token.connect(owner).functions.mintPNouns(3, proof, { value: 0 });
    // await tx.wait();

    const [count1] = await token.functions.balanceOf(owner.address);
    expect(count1.toNumber()).equal(3);
    const [count2] = await token.functions.totalSupply();
    expect(count2.toNumber()).equal(Number(totalSupply) + 3);
  });

  it("sold out", async function () {
    await token.functions.setPhase(0, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));

    // ownerを含まないマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [owner.address]));

    const [count] = await token.functions.totalSupply();
    await token.setMintLimit(count.toNumber() + 1);
    const [mintLimit] = await token.functions.mintLimit();

    // 1つ目はエラーにならない
    await token.functions.mintPNouns(1, proof, { value: 0 });
    // 2つ目はエラーになる
    await expect(token.functions.mintPNouns(1, proof, { value: 0 }))
      .to.be.revertedWith("Sold out");

    const [count2] = await token.functions.totalSupply();
    const [mintLimit2] = await token.functions.mintLimit();

    await token.setMintLimit(2100);
  });

  it("administrators mint", async function () {
    await token.functions.setPhase(0, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));

    // ownerを含まないマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // administratorのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [administrator.address]));

    // エラーにならない
    await token.connect(administrator).functions.mintPNouns(10, proof, { value: 0 });

    const [count1] = await token.functions.balanceOf(administrator.address);
    expect(count1.toNumber()).equal(10);
  });

  it("mint free error", async function () {
    await token.functions.setPhase(0, 5);
    const [phase] = await token.functions.phase();
    expect(phase).equal(0);
    const [purchaseUnit] = await token.functions.purchaseUnit();
    expect(purchaseUnit).equal(5)
    const [mintPrice] = await token.functions.mintPrice();
    expect(mintPrice).equal(ethers.utils.parseEther("0.05"));
    const [count] = await token.functions.totalSupply();
    const [mintLimit] = await token.functions.mintLimit();

    // ownerを含まないマークルツリー
    const tree = createTree([{ address: authorized.address }, { address: authorized2.address }]);
    await token.functions.setMerkleRoot(tree.getHexRoot());

    // ownerのマークルリーフ
    const proof = tree.getHexProof(ethers.utils.solidityKeccak256(['address'], [owner.address]));

    await expect(token.functions.mintPNouns(1, proof, { value: mintPrice }))
      .to.be.revertedWith("owners mint price is free");

  });

});
describe("pNounsToken adminMint", function () {

  it("adminMint normal", async function () {
    const [count1] = await token.functions.balanceOf(owner.address);
    const [count2] = await token.functions.balanceOf(authorized.address);
    const [count3] = await token.functions.balanceOf(authorized2.address);
    const [count4] = await token.functions.balanceOf(unauthorized.address);
    const [count5] = await token.functions.balanceOf(treasury.address);
    const [count6] = await token.functions.balanceOf(administrator.address);
    

    await token.connect(administrator).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [1,2,3,4,5,6]
      );

      const [count1a] = await token.functions.balanceOf(owner.address);
      const [count2a] = await token.functions.balanceOf(authorized.address);
      const [count3a] = await token.functions.balanceOf(authorized2.address);
      const [count4a] = await token.functions.balanceOf(unauthorized.address);
      const [count5a] = await token.functions.balanceOf(treasury.address);
      const [count6a] = await token.functions.balanceOf(administrator.address);
      
    expect(count1a.toNumber()).equal(count1.toNumber()+1);
    expect(count2a.toNumber()).equal(count2.toNumber()+2);
    expect(count3a.toNumber()).equal(count3.toNumber()+3);
    expect(count4a.toNumber()).equal(count4.toNumber()+4);
    expect(count5a.toNumber()).equal(count5.toNumber()+5);
    expect(count6a.toNumber()).equal(count6.toNumber()+6);
  });

  it("adminMint args error", async function () {
    // 引数の数が違う
    await expect( token.connect(administrator).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [1,2,3,4,5]
      ))
      .to.be.revertedWith("args error");
  });

  it("adminMint mintAmount is zero", async function () {
    // 引数の数が違う
    await expect( token.connect(administrator).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [1,2,0,4,5,6]
      ))
      .to.be.revertedWith("mintAmount is zero");
  });

  it("adminMint exceed limitAdminMint", async function () {
    // 合計1００以上のミント
    await expect( token.connect(administrator).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [10,10,10,10,50,11]
      ))
      .to.be.revertedWith("exceed limitAdminMint");
  });

  it("adminMint exceed mintLimit", async function () {

    const tx = await token.setMintLimit(60);
    await tx.wait();
    const [mintLimit2] = await token.functions.mintLimit();
    expect(mintLimit2.toNumber()).equal(60);

    // max以上のミント
    await expect( token.connect(administrator).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [10,10,10,10,10,11]
      ))
      .to.be.revertedWith("exceed mintLimit");
  });

  it("adminMint not admin", async function () {
    
    // unauthorized で実行
    await expect( token.connect(unauthorized).functions.adminMint(
      [owner.address, authorized.address, authorized2.address, unauthorized.address, treasury.address, administrator.address],
      [10,10,10,10,10,11]
      ))
      .to.be.revertedWith("caller is not the admin");
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