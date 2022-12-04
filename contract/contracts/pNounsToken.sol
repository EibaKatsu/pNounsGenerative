// SPDX-License-Identifier: MIT

/*
 * Created by Eiba (@eiba8884)
 */

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./pNounsContractFilter.sol";

contract pNounsToken is pNounsContractFilter {
    enum SalePhase {
        Locked,
        PreSale,
        PublicSale
    }
    SalePhase public phase = SalePhase.Locked; // セールフェーズ
    uint256 public purchaseUnit = 5; // 購入単位

    bytes32 public merkleRoot; // プレセールのマークルルート
    address public treasuryAddress; // トレジャリーウォレット
    uint256 public maxMintPerAddress = 100; // 1人当たりの最大ミント数
    uint256 constant mintForTreasuryAddress = 100; // トレジャリーへの初回配布数

    mapping(address => uint256) public mintCount; // アドレスごとのミント数

    constructor(
        IAssetProvider _assetProvider,
        address _treasuryAddress,
        address[] memory _administrators
    )
        pNounsContractFilter(
            _assetProvider,
            "pNouns NFT",
            "pNouns",
            _administrators
        )
    {
        description = "This is the first NFT of pNouns project (https://pnouns.wtf/).";
        mintPrice = 0.05 ether;
        mintLimit = 2100;
        treasuryAddress = _treasuryAddress;

        // for (uint256 i; i < mintForTreasuryAddress; i++) {
        //     _safeMint(treasuryAddress, nextTokenId+i);
        // }
        _safeMint(treasuryAddress, mintForTreasuryAddress);
        nextTokenId += mintForTreasuryAddress;

        mintCount[treasuryAddress] += mintForTreasuryAddress;
    }

    function mintPNouns(
        uint256 _mintAmount, // ミント数
        bytes32[] calldata _merkleProof // マークルツリー
    ) external payable {
        // オーナーチェック
        if (!hasAdminOrOwner()) {
            // originチェック
            require(tx.origin == msg.sender, "cannot mint from non-origin");

            // セールフェイズチェック
            if (phase == SalePhase.Locked) {
                revert("Sale locked");
            } else if (phase == SalePhase.PreSale) {
                // マークルツリーが正しいこと
                bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
                require(
                    MerkleProof.verifyCalldata(_merkleProof, merkleRoot, leaf),
                    "Invalid Merkle Proof"
                );
            } else if (phase == SalePhase.PublicSale) {
                // チェック不要
            }

            // ミント数が購入単位と一致していること,ミント数が設定されていること
            require(
                _mintAmount % purchaseUnit == 0 && _mintAmount > 0,
                "Invalid purchaseUnit"
            );

            // アドレスごとのミント数上限チェック
            require(
                mintCount[msg.sender] + _mintAmount <= maxMintPerAddress,
                "exceeds number of per address"
            );

            // ミント数に応じた ETHが送金されていること
            uint256 cost = mintPrice * _mintAmount;
            require(cost <= msg.value, "insufficient funds");
        } else {
            require(msg.value == 0, "owners mint price is free");
        }

        // 最大供給数に達していないこと
        require(totalSupply() + _mintAmount <= mintLimit, "Sold out");

        // ミント
        // for (uint256 i; i < _mintAmount; i++) {
        //     _safeMint(msg.sender, nextTokenId + i);
        // }
        _safeMint(msg.sender, _mintAmount);
        nextTokenId += _mintAmount;

        // ミント数カウントアップ
        mintCount[msg.sender] += _mintAmount;
    }

    function withdraw() external onlyAdminOrOwner {
        require(
            treasuryAddress != address(0),
            "treasuryAddress shouldn't be 0"
        );
        (bool sent, ) = payable(treasuryAddress).call{
            value: address(this).balance
        }("");
        require(sent, "failed to move fund to treasuryAddress contract");
    }

    function setTreasuryAddress(address _treasury) external onlyAdminOrOwner {
        treasuryAddress = _treasury;
    }

    function setPhase(SalePhase _phase, uint256 _purchaseUnit)
        external
        onlyAdminOrOwner
    {
        phase = _phase;
        purchaseUnit = _purchaseUnit;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyAdminOrOwner {
        merkleRoot = _merkleRoot;
    }

    function setMaxMintPerAddress(uint256 _maxMintPerAddress)
        external
        onlyAdminOrOwner
    {
        maxMintPerAddress = _maxMintPerAddress;
    }

    function mint() public payable override returns (uint256) {
        revert("this function is not used");
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }
}
